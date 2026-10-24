"""
Views e ViewSets da API do Antecipe (DRF).

Endpoints:
- POST /api/upload-csv/ : Recebe o CSV, processa em lotes e gera log de auditoria.
- GET, POST, PUT, PATCH, DELETE /api/recebiveis/ : CRUD com paginação de 20 em 20 registros.
- GET /api/lotes/ : Listagem e detalhe de lotes.
- GET /api/regras/ : Visualização das regras de negócio ativas e configuração de precificação.
"""

import json
from pathlib import Path
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from django.conf import settings
from django.db import models
from core.models import Cedente, Fundo, LoteImportacao, PerfilUsuario, Recebivel
from core.permissions import IsGestor
from core.rules_engine import ContextoValidacao, MotorDeRegras
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
    Garante isolamento de dados:
    - Se usuário EMPRESA (cedente), visualiza somente recebíveis correspondentes ao seu cadastro na tabela Cedente ou username.
    - Se usuário GESTOR (fundo), visualiza somente recebíveis relacionados ao seu cadastro na tabela Fundo ou username.
    """
    queryset = Recebivel.objects.all().order_by('-lote__criado_em', 'linha')
    serializer_class = RecebivelSerializer
    pagination_class = PaginacaoPadrao20

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # Filtragem com base na identidade do usuário logado
        if user and user.is_authenticated:
            perfil = getattr(user, 'perfil', None)
            username = user.username.strip()

            if perfil and perfil.role == PerfilUsuario.Role.EMPRESA:
                # Busca registro na tabela Cedente
                cedente_obj = Cedente.objects.filter(usuario=user).first()
                if cedente_obj:
                    qs = qs.filter(models.Q(nome_cedente__iexact=cedente_obj.nome) | models.Q(doc_cedente=cedente_obj.codigo))
                elif Recebivel.objects.filter(nome_cedente__iexact=username).exists():
                    qs = qs.filter(nome_cedente__iexact=username)
            elif perfil and perfil.role == PerfilUsuario.Role.GESTOR:
                # Fundo vê os recebíveis do seu fundo
                fundo_obj = Fundo.objects.filter(usuario=user).first()
                if fundo_obj:
                    qs = qs.filter(models.Q(nome_fundo__iexact=fundo_obj.nome) | models.Q(doc_fundo=fundo_obj.codigo))
                elif Recebivel.objects.filter(nome_fundo__iexact=username).exists():
                    qs = qs.filter(nome_fundo__iexact=username)

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

    # Salva o arquivo enviado em um arquivo temporário no disco para permitir
    # múltiplas passadas (pré-cálculo e ingestão) sem problemas com ponteiro ou arquivo fechado
    import tempfile
    import shutil

    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp:
        for chunk in arquivo.chunks():
            tmp.write(chunk)
        temp_path = Path(tmp.name)

    service = ImportadorCSVService()
    try:
        lote, registros_log = service.processar_arquivo(
            arquivo_ou_caminho=temp_path,
            nome_arquivo=arquivo.name,
            caminho_log=caminho_log,
        )
    except Exception as e:
        if temp_path.exists():
            temp_path.unlink()
        return Response(
            {'erro': f'Falha ao processar arquivo CSV: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    finally:
        if temp_path.exists():
            temp_path.unlink()

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
@permission_classes([IsGestor])
def regras_vigentes_view(request):
    """
    GET: Retorna as regras vigentes e a taxa de precificação (priorizando o modelo Fundo do usuário).
    POST / PUT: Atualiza as regras e precificação no banco (tabela Fundo) e no JSON. Conforme regra da Época 2:
      - As notas aprovadas NUNCA se tornam rejeitadas.
      - As notas antes rejeitadas que agora passarem nas novas regras tornam-se aprovadas.
      - A precificação de todas as notas aprovadas é recalculada em tempo real.
    """
    # Identifica o fundo associado ao usuário gestor se existir
    fundo_obj = None
    if request.user.is_authenticated:
        fundo_obj = Fundo.objects.filter(usuario=request.user).first()
    if not fundo_obj:
        fundo_obj = Fundo.objects.first()

    service = ImportadorCSVService(fundo_id=fundo_obj.id if fundo_obj else None)

    if request.method in ['POST', 'PUT']:
        novo_json = request.data
        if not isinstance(novo_json, dict) or 'validadores' not in novo_json:
            return Response(
                {'erro': 'JSON de configuração inválido. Esperada chave "validadores".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Atualiza na tabela Fundo se existir
        if fundo_obj:
            fundo_info = novo_json.get("fundo", {})
            if fundo_info.get("nome"):
                fundo_obj.nome = fundo_info["nome"]
            if fundo_info.get("cnpj"):
                fundo_obj.codigo = fundo_info["cnpj"]

            for v in novo_json.get("validadores", []):
                cod = v.get("codigo")
                ativo = v.get("ativo", True)
                params = v.get("parametros", {})

                if cod == "CNPJ_SACADO_VALIDO":
                    fundo_obj.validador_cnpj_sacado_ativo = ativo
                elif cod == "SITUACAO_CADASTRAL_SACADO":
                    fundo_obj.validador_situacao_cadastral_ativo = ativo
                    fundo_obj.situacoes_cadastrais_aceitas = params.get("situacoes_aceitas", ["ATIVA"])
                elif cod == "TIPO_RECEBIVEL":
                    fundo_obj.validador_tipo_recebivel_ativo = ativo
                    fundo_obj.tipos_recebivel_aceitos = params.get("tipos_aceitos", ["Duplicata", "Duplicata de Serviço"])
                elif cod == "VALOR_MINIMO":
                    fundo_obj.validador_valor_minimo_ativo = ativo
                    fundo_obj.valor_minimo = Decimal(str(params.get("valor_minimo", 50.0)))
                elif cod == "NAO_VENCIDA":
                    fundo_obj.validador_nao_vencida_ativo = ativo
                elif cod == "PRAZO_MAXIMO":
                    fundo_obj.validador_prazo_maximo_ativo = ativo
                    fundo_obj.prazo_maximo_dias = int(params.get("prazo_maximo_dias", 180))
                elif cod == "CONCENTRACAO_MAXIMA_SACADO":
                    fundo_obj.validador_concentracao_sacado_ativo = ativo
                    fundo_obj.concentracao_sacado_percentual = Decimal(str(params.get("percentual_maximo", 10.0)))
                    fundo_obj.concentracao_sacado_agrupamento = params.get("agrupamento", "RAIZ_CNPJ")
                elif cod == "PRAZO_MINIMO":
                    fundo_obj.validador_prazo_minimo_ativo = ativo
                    fundo_obj.prazo_minimo_dias = int(params.get("prazo_minimo_dias", 30))
                elif cod == "CONCENTRACAO_MAXIMA_CEDENTE":
                    fundo_obj.validador_concentracao_cedente_ativo = ativo
                    fundo_obj.concentracao_cedente_percentual = Decimal(str(params.get("percentual_maximo", 8.0)))

            prec = novo_json.get("precificacao", {})
            fundo_obj.precificacao_metodo = prec.get("metodo", "DESCONTO_SIMPLES")
            fundo_obj.taxa_mensal_percentual = Decimal(str(prec.get("taxa_mensal_percentual", 2.0)))
            fundo_obj.base_dias = int(prec.get("base_dias", 30))
            fundo_obj.save()

        # Salva também no arquivo de regras para compatibilidade
        caminho = service.caminho_regras
        try:
            with open(caminho, 'w', encoding='utf-8') as f:
                json.dump(novo_json, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

        # Recarrega o motor com as novas regras
        service.config_regras = novo_json
        service.motor = MotorDeRegras(novo_json)

        # Reavaliação:
        # 1. Carrega contexto de CNPJs
        situacoes = service.carregar_situacoes_cadastrais()

        # Totais para concentração considerando notas existentes
        from decimal import Decimal
        from django.db import connection

        # Reavalia notas BARRADAS para ver se passam com as novas regras
        notas_barradas = Recebivel.objects.filter(status=Recebivel.Status.BARRADO).iterator(chunk_size=2000)
        recs_para_aprovar = []
        total_novas_aprovadas = 0
        for r in notas_barradas:
            # Não desfaz duplicidade intralote genuína
            if Recebivel.CODIGO_DUPLICIDADE in (r.barrado_por or []):
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

                if len(recs_para_aprovar) >= 2000:
                    Recebivel.objects.bulk_update(
                        recs_para_aprovar,
                        fields=['status', 'barrado_por', 'motivo_recusa', 'prazo_dias', 'desconto', 'valor_liquido'],
                        batch_size=2000,
                    )
                    total_novas_aprovadas += len(recs_para_aprovar)
                    recs_para_aprovar = []

        if recs_para_aprovar:
            Recebivel.objects.bulk_update(
                recs_para_aprovar,
                fields=['status', 'barrado_por', 'motivo_recusa', 'prazo_dias', 'desconto', 'valor_liquido'],
                batch_size=2000,
            )
            total_novas_aprovadas += len(recs_para_aprovar)

        # 2. Recalcula a precificação em tempo real de todas as notas APROVADAS
        prec_cfg = novo_json.get("precificacao", {})
        taxa_mensal = Decimal(str(prec_cfg.get("taxa_mensal_percentual", 2.0))) / Decimal(100)
        base_dias = Decimal(str(prec_cfg.get("base_dias", 30)))

        if connection.vendor == 'postgresql':
            table_name = connection.ops.quote_name(Recebivel._meta.db_table)
            with connection.cursor() as cursor:
                cursor.execute(f"""
                    UPDATE {table_name}
                    SET prazo_dias = GREATEST(data_vencimento_original - %s, 0),
                        desconto = ROUND(valor_nominal * (%s * (GREATEST(data_vencimento_original - %s, 0)::numeric / %s)), 2),
                        valor_liquido = valor_nominal - ROUND(valor_nominal * (%s * (GREATEST(data_vencimento_original - %s, 0)::numeric / %s)), 2)
                    WHERE status = 'APROVADO';
                """, [service.data_base, taxa_mensal, service.data_base, base_dias, taxa_mensal, service.data_base, base_dias])
                total_reprecificadas = cursor.rowcount
        else:
            todas_aprovadas = Recebivel.objects.filter(status=Recebivel.Status.APROVADO).iterator(chunk_size=2000)
            recs_precificacao = []
            total_reprecificadas = 0
            for r in todas_aprovadas:
                dias, desc, liq = service.motor.calcular_precificacao(
                    r.valor_nominal, r.data_vencimento_original, service.data_base
                )
                r.prazo_dias = dias
                r.desconto = desc
                r.valor_liquido = liq
                recs_precificacao.append(r)
                if len(recs_precificacao) >= 2000:
                    Recebivel.objects.bulk_update(recs_precificacao, fields=['prazo_dias', 'desconto', 'valor_liquido'], batch_size=2000)
                    total_reprecificadas += len(recs_precificacao)
                    recs_precificacao = []
            if recs_precificacao:
                Recebivel.objects.bulk_update(recs_precificacao, fields=['prazo_dias', 'desconto', 'valor_liquido'], batch_size=2000)
                total_reprecificadas += len(recs_precificacao)

        return Response({
            'mensagem': 'Configuração de regras e precificação atualizada com sucesso!',
            'novas_aprovadas': total_novas_aprovadas,
            'total_reprecificadas': total_reprecificadas,
            'regras': fundo_obj.to_config_dict() if fundo_obj else novo_json,
        })

    # Resposta GET
    if fundo_obj:
        return Response(fundo_obj.to_config_dict())
    return Response(service.config_regras)
