"""
Motor de Regras Dinâmico (Strategy Pattern) e Precificação Financeira.

Permite aplicar os validadores configurados no JSON do fundo sem deploy ou hardcode:
- PRAZO_MAXIMO
- PRAZO_MINIMO
- NAO_VENCIDA
- VALOR_MINIMO
- TIPO_RECEBIVEL
- CNPJ_SACADO_VALIDO
- SITUACAO_CADASTRAL_SACADO
- CONCENTRACAO_MAXIMA_SACADO
- CONCENTRACAO_MAXIMA_CEDENTE
"""

from __future__ import annotations

import json
from abc import ABC, abstractmethod
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from core.utils import raiz_cnpj, somente_digitos


class ContextoValidacao:
    """
    Contexto contendo métricas agregadas da carteira/lote para validação de concentração
    e base em cache para situações cadastrais e duplicidade.
    """

    def __init__(
        self,
        data_base: date,
        situacoes_cnpj: Optional[Dict[str, str]] = None,
        totais_fundo: Optional[Dict[str, Decimal]] = None,
        totais_sacado_fundo: Optional[Dict[Tuple[str, str], Decimal]] = None,
        totais_cedente_fundo: Optional[Dict[Tuple[str, str], Decimal]] = None,
        hashes_aprovados: Optional[Set[str]] = None,
    ):
        self.data_base = data_base
        self.situacoes_cnpj = situacoes_cnpj or {}
        # chave: doc_fundo
        self.totais_fundo = totais_fundo or {}
        # chave: (doc_fundo, raiz_sacado)
        self.totais_sacado_fundo = totais_sacado_fundo or {}
        # chave: (doc_fundo, doc_cedente)
        self.totais_cedente_fundo = totais_cedente_fundo or {}
        self.hashes_aprovados = hashes_aprovados or set()



class ValidadorStrategy(ABC):
    """Classe base abstrata para todas as regras de validação."""

    codigo: str = ""

    def __init__(self, parametros: Dict[str, Any]):
        self.parametros = parametros

    @abstractmethod
    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        """
        Retorna None se a nota for aceita.
        Retorna (codigo_regra, mensagem_humana) se for barrada.
        """
        pass


class ValidadorPrazoMaximo(ValidadorStrategy):
    codigo = "PRAZO_MAXIMO"

    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        limite = self.parametros.get("prazo_maximo_dias", 180)
        dt_venc = nota["data_vencimento_original"]
        dt_aquis = nota.get("data_aquisicao") or contexto.data_base
        dias = (dt_venc - dt_aquis).days
        if dias > limite:
            return (
                self.codigo,
                f"Prazo acima do limite: vence em {dias} dias; o limite configurado do fundo é {limite} dias.",
            )
        return None


class ValidadorPrazoMinimo(ValidadorStrategy):
    codigo = "PRAZO_MINIMO"

    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        limite = self.parametros.get("prazo_minimo_dias", 30)
        dt_venc = nota["data_vencimento_original"]
        dt_aquis = nota.get("data_aquisicao") or contexto.data_base
        dias = (dt_venc - dt_aquis).days
        if dias < limite:
            return (
                self.codigo,
                f"Prazo abaixo do mínimo permitido: prazo de {dias} dias é inferior a {limite} dias.",
            )
        return None


class ValidadorNaoVencida(ValidadorStrategy):
    codigo = "NAO_VENCIDA"

    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        dt_venc = nota["data_vencimento_original"]
        if contexto.data_base >= dt_venc:
            return (
                self.codigo,
                f"Nota vencida em {dt_venc.strftime('%d/%m/%Y')} (anterior ou igual à data base {contexto.data_base.strftime('%d/%m/%Y')}).",
            )
        return None


class ValidadorValorMinimo(ValidadorStrategy):
    codigo = "VALOR_MINIMO"

    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        minimo = Decimal(str(self.parametros.get("valor_minimo", 100.0)))
        valor = nota["valor_nominal"]
        if valor < minimo:
            return (
                self.codigo,
                f"Valor nominal de R$ {valor:,.2f} é inferior ao valor mínimo de R$ {minimo:,.2f}.",
            )
        return None


class ValidadorTipoRecebivel(ValidadorStrategy):
    codigo = "TIPO_RECEBIVEL"

    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        tipos_aceitos = self.parametros.get("tipos_aceitos", ["Duplicata", "Duplicata de Serviço"])
        tipo = nota.get("tipo_recebivel")
        if tipo not in tipos_aceitos:
            return (
                self.codigo,
                f"Tipo de recebível '{tipo}' não é aceito. Tipos permitidos: {', '.join(tipos_aceitos)}.",
            )
        return None


class ValidadorCnpjSacadoValido(ValidadorStrategy):
    codigo = "CNPJ_SACADO_VALIDO"

    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        doc = nota.get("doc_sacado", "")
        digitos = [int(c) for c in doc if c.isdigit()]
        if len(digitos) != 14:
            return self.codigo, f"CNPJ do sacado inválido (tamanho incorreto: {len(digitos)} dígitos)."

        # Validação dígitos verificadores
        def calc_dv(base: List[int]) -> int:
            pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] if len(base) == 12 else [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            s = sum(a * b for a, b in zip(base, pesos))
            resto = s % 11
            return 0 if resto < 2 else 11 - resto

        if calc_dv(digitos[:12]) != digitos[12] or calc_dv(digitos[:13]) != digitos[13]:
            return self.codigo, f"CNPJ do sacado '{doc}' possui dígitos verificadores inválidos."

        return None


class ValidadorSituacaoCadastralSacado(ValidadorStrategy):
    codigo = "SITUACAO_CADASTRAL_SACADO"

    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        situacoes_aceitas = [s.upper() for s in self.parametros.get("situacoes_aceitas", ["ATIVA"])]
        doc = nota.get("doc_sacado", "")
        cnpj_limpo = somente_digitos(doc)
        
        # Consulta primeiro pelo formato original, depois por dígitos limpos
        sit = contexto.situacoes_cnpj.get(doc) or contexto.situacoes_cnpj.get(cnpj_limpo, "ATIVA")
        sit_upper = sit.strip().upper()

        if sit_upper not in situacoes_aceitas:
            return (
                self.codigo,
                f"Sacado com situação cadastral '{sit_upper}' na Receita Federal (permitido apenas: {', '.join(situacoes_aceitas)}).",
            )
        return None


class ValidadorConcentracaoMaximaSacado(ValidadorStrategy):
    codigo = "CONCENTRACAO_MAXIMA_SACADO"

    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        pct_max = Decimal(str(self.parametros.get("percentual_maximo", 10.0)))
        fundo = nota.get("doc_fundo", "")
        sacado = nota.get("doc_sacado", "")
        raiz = raiz_cnpj(sacado)

        total_fundo = contexto.totais_fundo.get(fundo, Decimal(0))
        if total_fundo <= 0:
            return None

        total_sacado = contexto.totais_sacado_fundo.get((fundo, raiz), Decimal(0))
        pct = (total_sacado / total_fundo) * 100
        if pct > pct_max:
            return (
                self.codigo,
                f"Concentração do sacado ({pct:.2f}%) excede o limite máximo permitido de {pct_max:.2f}%.",
            )
        return None


class ValidadorConcentracaoMaximaCedente(ValidadorStrategy):
    codigo = "CONCENTRACAO_MAXIMA_CEDENTE"

    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        pct_max = Decimal(str(self.parametros.get("percentual_maximo", 8.0)))
        fundo = nota.get("doc_fundo", "")
        cedente = nota.get("doc_cedente", "")

        total_fundo = contexto.totais_fundo.get(fundo, Decimal(0))
        if total_fundo <= 0:
            return None

        total_cedente = contexto.totais_cedente_fundo.get((fundo, cedente), Decimal(0))
        pct = (total_cedente / total_fundo) * 100
        if pct > pct_max:
            return (
                self.codigo,
                f"Concentração do cedente ({pct:.2f}%) excede o limite máximo permitido de {pct_max:.2f}%.",
            )
        return None


class ValidadorDuplicidade(ValidadorStrategy):
    codigo = "DUPLICIDADE"

    def validar(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Optional[Tuple[str, str]]:
        hashes_existentes = getattr(contexto, 'hashes_aprovados', set())
        hash_id = nota.get("hash_id")
        if hash_id and hash_id in hashes_existentes:
            return (
                self.codigo,
                f"Nota duplicada com hash_id '{hash_id}'. Já existe um recebível idêntico aprovado no fundo.",
            )
        return None


REGISTRY_VALIDADORES = {
    "PRAZO_MAXIMO": ValidadorPrazoMaximo,
    "PRAZO_MINIMO": ValidadorPrazoMinimo,
    "NAO_VENCIDA": ValidadorNaoVencida,
    "VALOR_MINIMO": ValidadorValorMinimo,
    "TIPO_RECEBIVEL": ValidadorTipoRecebivel,
    "CNPJ_SACADO_VALIDO": ValidadorCnpjSacadoValido,
    "SITUACAO_CADASTRAL_SACADO": ValidadorSituacaoCadastralSacado,
    "CONCENTRACAO_MAXIMA_SACADO": ValidadorConcentracaoMaximaSacado,
    "CONCENTRACAO_MAXIMA_CEDENTE": ValidadorConcentracaoMaximaCedente,
    "DUPLICIDADE": ValidadorDuplicidade,
}


class MotorDeRegras:
    """Motor que orquestra a execução das regras dinâmicas e o cálculo financeiro."""

    def __init__(self, config_regras: Dict[str, Any]):
        self.config = config_regras
        self.validadores: List[ValidadorStrategy] = []
        self._carregar_validadores()

    def _carregar_validadores(self):
        for v_cfg in self.config.get("validadores", []):
            if v_cfg.get("ativo", False):
                codigo = v_cfg.get("codigo")
                cls_v = REGISTRY_VALIDADORES.get(codigo)
                if cls_v:
                    self.validadores.append(cls_v(v_cfg.get("parametros", {})))

    def validar_nota(self, nota: Dict[str, Any], contexto: ContextoValidacao) -> Tuple[bool, List[str], str]:
        """
        Valida a nota contra todas as regras ativas.
        Retorna (aprovada, lista_codigos_barrados, motivo_explicativo).
        """
        barrados = []
        motivos = []

        for validador in self.validadores:
            res = validador.validar(nota, contexto)
            if res:
                cod, mot = res
                barrados.append(cod)
                motivos.append(mot)

        aprovada = len(barrados) == 0
        motivo_str = " | ".join(motivos) if motivos else ""
        return aprovada, barrados, motivo_str

    def calcular_precificacao(
        self, valor_nominal: Decimal, data_vencimento: date, data_base: date
    ) -> Tuple[int, Decimal, Decimal]:
        """
        Calcula Desconto Simples Comercial conforme configurado na precificação:
        Taxa: taxa_mensal_percentual ao mês (base_dias).
        Fórmula: Desconto = Valor_Face * (Taxa_Mensal * (Dias_Ate_Vencimento / base_dias)).
        """
        prec_cfg = self.config.get("precificacao", {})
        taxa_mensal = Decimal(str(prec_cfg.get("taxa_mensal_percentual", 2.0))) / Decimal(100)
        base_dias = Decimal(str(prec_cfg.get("base_dias", 30)))

        dias = max((data_vencimento - data_base).days, 0)
        taxa_efetiva = taxa_mensal * (Decimal(dias) / base_dias)
        desconto = (valor_nominal * taxa_efetiva).quantize(Decimal("0.01"))
        valor_liquido = (valor_nominal - desconto).quantize(Decimal("0.01"))

        return dias, desconto, valor_liquido
