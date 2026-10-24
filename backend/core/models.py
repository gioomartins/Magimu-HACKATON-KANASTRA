"""
Modelagem de dados do Antecipe (Época 0 - Banco de Dados PostgreSQL).

Entidades:
    - LoteImportacao: cada upload de CSV (auditoria, totais e snapshot das regras).
    - Recebivel: cada linha do CSV + resultado da análise (status, motivos, preço).
    - SituacaoCadastralCNPJ: base de apoio (mock da Receita) para a regra
      SITUACAO_CADASTRAL_SACADO.

Decisões de idempotência (ver docs/regrasnegocio.md):
    - ``hash_id`` NÃO é único globalmente: notas duplicadas precisam ser
      gravadas como BARRADAS para que o front exiba o motivo da recusa.
    - Há um índice único PARCIAL (``WHERE status = 'APROVADO'``): o banco
      garante, mesmo sob concorrência, que a mesma nota nunca é aprovada
      (vendida) duas vezes.
"""

from __future__ import annotations

import uuid

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django.db.models import Q

from .utils import gerar_hash_recebivel, raiz_cnpj


class LoteImportacao(models.Model):
    """Um upload de CSV. Agrupa os recebíveis e guarda os totais da simulação."""

    class Status(models.TextChoices):
        PENDENTE = 'PENDENTE', 'Pendente'
        PROCESSANDO = 'PROCESSANDO', 'Processando'
        CONCLUIDO = 'CONCLUIDO', 'Concluído'
        ERRO = 'ERRO', 'Erro'

    # UUID evita expor a sequência de uploads na API (/api/lotes/<uuid>/).
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome_arquivo = models.CharField(max_length=255)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDENTE, db_index=True
    )

    # Snapshot do validadores_antecipe.json usado neste lote. Como o arquivo
    # pode mudar sem deploy, isso permite auditar "por que" uma nota foi
    # recusada com as regras vigentes no momento do processamento.
    regras_aplicadas = models.JSONField(default=dict, blank=True)
    data_base = models.DateField(help_text='Data-base usada no cálculo do desconto.')
    taxa_mensal_percentual = models.DecimalField(max_digits=7, decimal_places=4, default=0)

    # Totais consolidados (preenchidos ao final do processamento).
    total_linhas = models.PositiveIntegerField(default=0)
    total_aprovados = models.PositiveIntegerField(default=0)
    total_barrados = models.PositiveIntegerField(default=0)
    valor_nominal_total = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_nominal_aprovado = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_liquido_aprovado = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_nominal_barrado = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Linhas que não puderam ser lidas (layout inválido): [{"linha": 10, "erro": "..."}]
    linhas_invalidas = models.JSONField(default=list, blank=True)
    mensagem_erro = models.TextField(blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    iniciado_em = models.DateTimeField(null=True, blank=True)
    finalizado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'antecipe_lote_importacao'
        ordering = ['-criado_em']
        verbose_name = 'lote de importação'
        verbose_name_plural = 'lotes de importação'

    def __str__(self) -> str:
        return f'{self.nome_arquivo} ({self.get_status_display()})'


class Recebivel(models.Model):
    """
    Uma nota (recebível) importada do CSV e o resultado da sua análise.

    Os campos espelham 1:1 as colunas do CSV (desnormalizado de propósito:
    lotes de até 500 mil linhas são gravados com bulk_create, sem joins).
    """

    class Status(models.TextChoices):
        # Valores compatíveis com resultado_esperado_100k.json; labels para a UI.
        PENDENTE = 'PENDENTE', 'Pendente'
        APROVADO = 'APROVADO', 'Aprovada'
        BARRADO = 'BARRADO', 'Recusada'

    # Código usado em ``barrado_por`` quando a recusa é por duplicidade
    # (validação obrigatória, não configurável pelo gestor).
    CODIGO_DUPLICIDADE = 'DUPLICIDADE'

    lote = models.ForeignKey(
        LoteImportacao,
        on_delete=models.CASCADE,
        related_name='recebiveis',
        # Já coberto pelos índices compostos (lote, linha) e (lote, status).
        db_index=False,
    )
    linha = models.PositiveIntegerField(
        help_text='Número da linha no CSV (o cabeçalho é a linha 1).'
    )

    # --- Colunas do CSV -----------------------------------------------------
    nome_fundo = models.CharField(max_length=255)
    doc_fundo = models.CharField(max_length=20)
    nome_cedente = models.CharField(max_length=255)
    doc_cedente = models.CharField(max_length=20)
    nome_sacado = models.CharField(max_length=255)
    doc_sacado = models.CharField(max_length=20)
    nu_documento = models.CharField(max_length=64)
    tipo_recebivel = models.CharField(max_length=64)
    valor_nominal = models.DecimalField(max_digits=15, decimal_places=2)
    data_vencimento_original = models.DateField()
    data_aquisicao = models.DateField()

    # --- Campos derivados (calculados na importação) -------------------------
    raiz_cnpj_sacado = models.CharField(
        max_length=8, help_text='8 primeiros dígitos do CNPJ do sacado (matriz + filiais).'
    )
    hash_id = models.CharField(
        max_length=64,
        help_text='SHA-256 de doc_cedente + doc_sacado + nu_documento + vencimento.',
    )

    # --- Resultado da análise -----------------------------------------------
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDENTE)
    barrado_por = ArrayField(
        models.CharField(max_length=64),
        default=list,
        blank=True,
        help_text='Códigos das regras que recusaram a nota (ex: ["TIPO_RECEBIVEL", "PRAZO_MAXIMO"]).',
    )
    motivo_recusa = models.TextField(
        blank=True, help_text='Explicação em linguagem clara para a empresa.'
    )

    # --- Precificação (desconto simples) ------------------------------------
    prazo_dias = models.IntegerField(
        null=True, blank=True, help_text='Dias entre a data-base e o vencimento.'
    )
    desconto = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    valor_liquido = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'antecipe_recebivel'
        ordering = ['lote', 'linha']
        verbose_name = 'recebível'
        verbose_name_plural = 'recebíveis'
        constraints = [
            # Idempotência: a mesma nota nunca pode estar APROVADA duas vezes.
            # Índice parcial -> duplicatas BARRADAS continuam podendo ser gravadas.
            models.UniqueConstraint(
                fields=['hash_id'],
                condition=Q(status='APROVADO'),
                name='uniq_recebivel_hash_aprovado',
            ),
            # Uma linha do CSV gera exatamente um recebível no lote.
            models.UniqueConstraint(
                fields=['lote', 'linha'], name='uniq_recebivel_lote_linha'
            ),
            # Nota aprovada sempre tem preço calculado.
            models.CheckConstraint(
                condition=~Q(status='APROVADO') | Q(valor_liquido__isnull=False),
                name='chk_recebivel_aprovado_tem_valor_liquido',
            ),
            # Nota recusada sempre informa ao menos uma regra que a barrou.
            models.CheckConstraint(
                condition=~Q(status='BARRADO') | ~Q(barrado_por=[]),
                name='chk_recebivel_barrado_tem_motivo',
            ),
        ]
        indexes = [
            # Busca de duplicidade (hashes já vistos). Índice btree simples, sem o
            # índice extra "_like" que o db_index=True criaria para CharField.
            models.Index(fields=['hash_id'], name='idx_receb_hash'),
            # Listagem/paginação do resultado de um lote e filtro por status.
            models.Index(fields=['lote', 'status'], name='idx_receb_lote_status'),
            # Regra CONCENTRACAO_MAXIMA_SACADO (soma por fundo + raiz do sacado).
            models.Index(fields=['doc_fundo', 'raiz_cnpj_sacado'], name='idx_receb_fundo_sacado'),
            # Regra CONCENTRACAO_MAXIMA_CEDENTE (soma por fundo + cedente).
            models.Index(fields=['doc_fundo', 'doc_cedente'], name='idx_receb_fundo_cedente'),
            # Filtro da UI "recusadas por <regra>": barrado_por @> ARRAY['PRAZO_MAXIMO'].
            GinIndex(fields=['barrado_por'], name='idx_receb_barrado_por_gin'),
        ]

    def __str__(self) -> str:
        return f'{self.nu_documento} - {self.nome_sacado} ({self.get_status_display()})'

    def preencher_campos_derivados(self) -> None:
        """
        Calcula ``hash_id`` e ``raiz_cnpj_sacado``.

        Deve ser chamado explicitamente antes de ``bulk_create`` (que não
        executa ``save()``). O ``save()`` chama este método automaticamente.
        """
        self.raiz_cnpj_sacado = raiz_cnpj(self.doc_sacado)
        self.hash_id = gerar_hash_recebivel(
            self.doc_cedente, self.doc_sacado, self.nu_documento, self.data_vencimento_original
        )

    def save(self, *args, **kwargs):
        self.preencher_campos_derivados()
        super().save(*args, **kwargs)


class SituacaoCadastralCNPJ(models.Model):
    """
    Situação cadastral de CNPJs (mock da Receita Federal - cnpj_situacao_mock.csv).

    Carregada via ``manage.py carregar_situacao_cadastral``. Consultada em
    memória (cache) pela regra SITUACAO_CADASTRAL_SACADO.
    """

    cnpj = models.CharField(max_length=14, primary_key=True, help_text='Somente dígitos.')
    cnpj_formatado = models.CharField(max_length=18)
    situacao = models.CharField(max_length=20, db_index=True)  # ATIVA, BAIXADA, INAPTA, SUSPENSA...
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'antecipe_situacao_cadastral_cnpj'
        ordering = ['cnpj']
        verbose_name = 'situação cadastral de CNPJ'
        verbose_name_plural = 'situações cadastrais de CNPJ'

    def __str__(self) -> str:
        return f'{self.cnpj_formatado} - {self.situacao}'


class PerfilUsuario(models.Model):
    """
    Perfil estendido para controle de acesso RBAC no Antecipe.
    - GESTOR: Acesso irrestrito (upload, dashboard, leitura e escrita de regras FIDC).
    - EMPRESA: Acesso operacional (upload de notas e visualização da carteira do cedente).
    """

    class Role(models.TextChoices):
        GESTOR = 'GESTOR', 'Gestor do Fundo'
        EMPRESA = 'EMPRESA', 'Empresa Cedente'

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil',
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPRESA,
        db_index=True,
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'antecipe_perfil_usuario'
        verbose_name = 'perfil de usuário'
        verbose_name_plural = 'perfis de usuários'

    def __str__(self) -> str:
        return f'{self.usuario.username} ({self.role})'

