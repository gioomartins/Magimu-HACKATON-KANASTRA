"""
Funções utilitárias de normalização e identidade de recebíveis.

Ficam fora dos models para que possam ser reutilizadas pelo motor de regras
e pelo serviço de importação (que usa bulk_create e, portanto, não passa
pelo ``Model.save()``).
"""

from __future__ import annotations

import hashlib
import re
from datetime import date

_NAO_DIGITOS = re.compile(r'\D')


def somente_digitos(documento: str | None) -> str:
    """Remove máscara de CNPJ/CPF: '92.234.400/0001-80' -> '92234400000180'."""
    return _NAO_DIGITOS.sub('', documento or '')


def raiz_cnpj(documento: str | None) -> str:
    """
    Retorna a raiz (8 primeiros dígitos) do CNPJ.

    Matriz e filiais compartilham a mesma raiz, por isso ela é usada no
    agrupamento da regra CONCENTRACAO_MAXIMA_SACADO (agrupamento RAIZ_CNPJ).
    """
    return somente_digitos(documento)[:8]


def normalizar_nu_documento(nu_documento: str | None) -> str:
    """Normaliza o número da nota para comparação (sem espaços, caixa alta)."""
    return (nu_documento or '').strip().upper()


def gerar_hash_recebivel(
    doc_cedente: str,
    doc_sacado: str,
    nu_documento: str,
    data_vencimento: date,
) -> str:
    """
    Gera a identidade única (SHA-256) de um recebível para controle de duplicidade.

    Composição: ``doc_cedente + doc_sacado + nu_documento + data_vencimento``.

    Por que a data de vencimento entra na chave?
        Na base real existem contratos parcelados (Duplicatas, CCBs e Notas
        Comerciais) em que o MESMO número de documento aparece em várias linhas,
        uma para cada parcela, com vencimentos diferentes. Sem o vencimento na
        chave, ~2.200 parcelas legítimas de Duplicata seriam recusadas como
        "duplicadas". Com ele, a base de 100 mil linhas tem zero colisões.

    Os documentos são normalizados (apenas dígitos) para que a mesma nota
    enviada com ou sem máscara gere o mesmo hash.
    """
    chave = '|'.join(
        (
            somente_digitos(doc_cedente),
            somente_digitos(doc_sacado),
            normalizar_nu_documento(nu_documento),
            data_vencimento.isoformat(),
        )
    )
    return hashlib.sha256(chave.encode('utf-8')).hexdigest()
