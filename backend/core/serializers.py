"""
Serializers para a API do Antecipe (DRF).
"""

from rest_framework import serializers
from core.models import LoteImportacao, Recebivel


class RecebivelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recebivel
        fields = [
            'id',
            'lote',
            'linha',
            'nome_fundo',
            'doc_fundo',
            'nome_cedente',
            'doc_cedente',
            'nome_sacado',
            'doc_sacado',
            'nu_documento',
            'tipo_recebivel',
            'valor_nominal',
            'data_vencimento_original',
            'data_aquisicao',
            'raiz_cnpj_sacado',
            'hash_id',
            'status',
            'barrado_por',
            'motivo_recusa',
            'prazo_dias',
            'desconto',
            'valor_liquido',
            'criado_em',
        ]


class LoteImportacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoteImportacao
        fields = [
            'id',
            'nome_arquivo',
            'status',
            'total_linhas',
            'total_aprovados',
            'total_barrados',
            'valor_nominal_total',
            'valor_nominal_aprovado',
            'valor_liquido_aprovado',
            'valor_nominal_barrado',
            'criado_em',
            'iniciado_em',
            'finalizado_em',
        ]
