from django.contrib import admin

from .models import LoteImportacao, Recebivel, SituacaoCadastralCNPJ


@admin.register(LoteImportacao)
class LoteImportacaoAdmin(admin.ModelAdmin):
    list_display = (
        'nome_arquivo', 'status', 'total_linhas', 'total_aprovados',
        'total_barrados', 'valor_liquido_aprovado', 'criado_em',
    )
    list_filter = ('status',)
    search_fields = ('nome_arquivo',)
    readonly_fields = ('id', 'criado_em', 'iniciado_em', 'finalizado_em')


@admin.register(Recebivel)
class RecebivelAdmin(admin.ModelAdmin):
    list_display = (
        'linha', 'nu_documento', 'nome_cedente', 'nome_sacado', 'tipo_recebivel',
        'valor_nominal', 'data_vencimento_original', 'status', 'valor_liquido',
    )
    list_filter = ('status', 'tipo_recebivel', 'nome_fundo')
    search_fields = ('nu_documento', 'doc_cedente', 'doc_sacado', 'nome_sacado', 'hash_id')
    readonly_fields = ('hash_id', 'raiz_cnpj_sacado', 'criado_em')
    list_select_related = ('lote',)
    # Lotes podem ter centenas de milhares de linhas.
    show_full_result_count = False


@admin.register(SituacaoCadastralCNPJ)
class SituacaoCadastralCNPJAdmin(admin.ModelAdmin):
    list_display = ('cnpj_formatado', 'situacao', 'atualizado_em')
    list_filter = ('situacao',)
    search_fields = ('cnpj', 'cnpj_formatado')
