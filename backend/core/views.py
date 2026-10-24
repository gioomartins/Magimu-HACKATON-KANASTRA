"""
Views e ViewSets da API do Antecipe (DRF).

Endpoints:
- POST /api/upload-csv/ : Recebe o CSV, processa em lotes e gera log de auditoria.
- GET, POST, PUT, PATCH, DELETE /api/recebiveis/ : CRUD com paginação de 20 em 20 registros.
- GET /api/lotes/ : Listagem e detalhe de lotes.
- GET /api/regras/ : Visualização das regras de negócio ativas e configuração de precificação.
"""

from pathlib import Path
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from django.conf import settings
from core.models import LoteImportacao, Recebivel
from core.serializers import LoteImportacaoSerializer, RecebivelSerializer
from core.services import ImportadorCSVService


class PaginacaoPadrao20(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class RecebivelViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para Recebíveis com paginação de 20 em 20.
    Permite filtrar por status, lote, sacado ou número de documento.
    """
    queryset = Recebivel.objects.all().order_by('-lote__criado_em', 'linha')
    serializer_class = RecebivelSerializer
    pagination_class = PaginacaoPadrao20

    def get_queryset(self):
        qs = super().get_queryset()
        lote_id = self.request.query_params.get('lote')
        status_param = self.request.query_params.get('status')
        nu_doc = self.request.query_params.get('nu_documento')

        if lote_id:
            qs = qs.filter(lote_id=lote_id)
        if status_param:
            qs = qs.filter(status=status_param.upper())
        if nu_doc:
            qs = qs.filter(nu_documento__icontains=nu_doc)

        return qs


class LoteImportacaoViewSet(viewsets.ReadOnlyModelViewSet):
    """Listagem e detalhes dos lotes processados."""
    queryset = LoteImportacao.objects.all().order_by('-criado_em')
    serializer_class = LoteImportacaoSerializer
    pagination_class = PaginacaoPadrao20


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_csv_view(request):
    """
    Endpoint para ingestão do arquivo CSV com notas de recebíveis.
    Processa com verificação de duplicidade, regras dinâmicas e precificação.
    """
    arquivo = request.FILES.get('file') or request.FILES.get('arquivo')
    if not arquivo:
        return Response(
            {'erro': 'Nenhum arquivo CSV enviado. Use o campo "file" ou "arquivo".'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not arquivo.name.lower().endswith('.csv'):
        return Response(
            {'erro': 'Formato inválido. O arquivo deve ter extensão .csv.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    logs_dir = settings.BASE_DIR / 'logs'
    logs_dir.mkdir(exist_ok=True)
    caminho_log = logs_dir / f"log_processamento_{arquivo.name}.json"

    service = ImportadorCSVService()
    try:
        lote, registros_log = service.processar_arquivo(
            arquivo_ou_caminho=arquivo,
            nome_arquivo=arquivo.name,
            caminho_log=caminho_log,
        )
    except Exception as e:
        return Response(
            {'erro': f'Falha ao processar arquivo CSV: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Retorna o resumo do lote e uma amostra dos primeiros registros do log
    return Response(
        {
            'mensagem': 'Arquivo processado com sucesso!',
            'lote': LoteImportacaoSerializer(lote).data,
            'arquivo_log': str(caminho_log.name),
            'amostra_log': registros_log[:25],
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'POST', 'PUT'])
def regras_vigentes_view(request):
    """
    GET: Retorna as regras vigentes e a taxa de precificação do arquivo validadores_antecipe.json.
    POST / PUT: Atualiza as regras e precificação. Conforme regra da Época 2:
      - As notas aprovadas NUNCA se tornam rejeitadas.
      - As notas antes rejeitadas que agora passarem nas novas regras tornam-se aprovadas.
      - A precificação de todas as notas aprovadas é recalculada em tempo real.
    """
    service = ImportadorCSVService()
    if request.method in ['POST', 'PUT']:
        novo_json = request.data
        if not isinstance(novo_json, dict) or 'validadores' not in novo_json:
            return Response(
                {'erro': 'JSON de configuração inválido. Esperada chave "validadores".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Salva no arquivo de regras
        caminho = service.caminho_regras
        with open(caminho, 'w', encoding='utf-8') as f:
            json.dump(novo_json, f, ensure_ascii=False, indent=2)

        # Recarrega o motor com as novas regras
        service.config_regras = novo_json
        service.motor = MotorDeRegras(novo_json)

        # Reavaliação:
        # 1. Carrega contexto de CNPJs
        situacoes = service.carregar_situacoes_cadastrais()

        # Totais para concentração considerando notas existentes
        from decimal import Decimal
        from django.db.models import Sum
        from core.utils import raiz_cnpj

        # Reavalia notas BARRADAS para ver se passam com as novas regras
        notas_barradas = Recebivel.objects.filter(status=Recebivel.Status.BARRADO)
        recs_para_aprovar = []
        for r in notas_barradas:
            # Não desfaz duplicidade intralote genuína
            if Recebivel.CODIGO_DUPLICIDADE in r.barrado_por:
                continue

            nota_dict = {
                "nu_documento": r.nu_documento,
                "doc_cedente": r.doc_cedente,
                "doc_sacado": r.doc_sacado,
                "doc_fundo": r.doc_fundo,
                "tipo_recebivel": r.tipo_recebivel,
                "valor_nominal": r.valor_nominal,
                "data_vencimento_original": r.data_vencimento_original,
                "data_aquisicao": r.data_aquisicao,
            }
            # Contexto simples para validação individual
            ctx = ContextoValidacao(data_base=service.data_base, situacoes_cnpj=situacoes)
            aprovada, barrados, motivo = service.motor.validar_nota(nota_dict, ctx)
            if aprovada:
                dias, desc, liq = service.motor.calcular_precificacao(
                    r.valor_nominal, r.data_vencimento_original, service.data_base
                )
                r.status = Recebivel.Status.APROVADO
                r.barrado_por = []
                r.motivo_recusa = ""
                r.prazo_dias = dias
                r.desconto = desc
                r.valor_liquido = liq
                recs_para_aprovar.append(r)

        if recs_para_aprovar:
            Recebivel.objects.bulk_update(
                recs_para_aprovar,
                fields=['status', 'barrado_por', 'motivo_recusa', 'prazo_dias', 'desconto', 'valor_liquido']
            )

        # 2. Recalcula a precificação em tempo real de todas as notas APROVADAS
        todas_aprovadas = Recebivel.objects.filter(status=Recebivel.Status.APROVADO)
        recs_precificacao = []
        for r in todas_aprovadas:
            dias, desc, liq = service.motor.calcular_precificacao(
                r.valor_nominal, r.data_vencimento_original, service.data_base
            )
            r.prazo_dias = dias
            r.desconto = desc
            r.valor_liquido = liq
            recs_precificacao.append(r)

        if recs_precificacao:
            Recebivel.objects.bulk_update(recs_precificacao, fields=['prazo_dias', 'desconto', 'valor_liquido'])

        return Response({
            'mensagem': 'Configuração de regras e precificação atualizada com sucesso!',
            'novas_aprovadas': len(recs_para_aprovar),
            'total_reprecificadas': len(recs_precificacao),
            'regras': novo_json,
        })

    return Response(service.config_regras)
