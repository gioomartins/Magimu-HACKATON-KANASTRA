"""
Serviço de Ingestão de CSV, Avaliação de Duplicatas e Validação em Lote.

Lida com:
1. Leitura sequencial e chunked de CSV (com suporte a arquivos de centenas de milhares de linhas).
2. Validação inicial e gestão de duplicatas com a regra de negócio da Época 1:
   - Duplicatas são impedidas de entrar na tabela como novo registro.
   - EXCEÇÃO: se a nota já existe na tabela com status BARRADO e a duplicata nova
     é APROVADA, a nota existente é atualizada com as informações da duplicata.
3. Execução do Motor de Regras e precificação.
4. Geração de log de auditoria em arquivo (.json ou .csv).
"""

from __future__ import annotations

import csv
import io
import json
import logging
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Set, Tuple

from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone

from core.models import (
    Cedente,
    Fundo,
    LoteImportacao,
    PerfilUsuario,
    Recebivel,
    SituacaoCadastralCNPJ,
)
from core.profiler import profile_performance
from core.rules_engine import ContextoValidacao, MotorDeRegras
from core.utils import gerar_hash_recebivel, raiz_cnpj, somente_digitos

logger = logging.getLogger(__name__)


def parse_data_br(data_str: str) -> date:
    """Converte 'DD/MM/AAAA' para date."""
    return datetime.strptime(data_str.strip(), "%d/%m/%Y").date()


def parse_decimal_br(valor_str: str) -> Decimal:
    """Converte '2.278,08' ou '2278,08' para Decimal."""
    limpo = valor_str.strip().replace(".", "").replace(",", ".")
    return Decimal(limpo)


class ImportadorCSVService:
    def __init__(self, caminho_regras: Optional[Path] = None, data_base: Optional[date] = None, fundo_id: Optional[int] = None):
        self.caminho_regras = caminho_regras or settings.ANTECIPE_VALIDADORES_PATH
        self.data_base = data_base or settings.ANTECIPE_DATA_BASE
        self.fundo_id = fundo_id
        self.config_regras = self._carregar_config_regras()
        self.motor = MotorDeRegras(self.config_regras)

    def _carregar_config_regras(self) -> Dict[str, Any]:
        """
        Carrega regras de validação.
        Prioridade:
        1. Se houver fundo_id ou registro na tabela Fundo, carrega do modelo Fundo no banco.
        2. Se não houver, carrega do JSON modelo (validadores_antecipe.json).
        """
        try:
            fundo_obj = None
            if self.fundo_id:
                fundo_obj = Fundo.objects.filter(id=self.fundo_id).first()
            if not fundo_obj:
                fundo_obj = Fundo.objects.first()

            if fundo_obj:
                return fundo_obj.to_config_dict()
        except Exception as e:
            logger.warning(f"Não foi possível carregar regras da tabela Fundo: {e}")

        if Path(self.caminho_regras).exists():
            with open(self.caminho_regras, encoding="utf-8") as f:
                return json.load(f)
        return {"validadores": [], "precificacao": {}}

    def carregar_situacoes_cadastrais(self) -> Dict[str, str]:
        """Carrega situações cadastrais do banco para memória."""
        qs = SituacaoCadastralCNPJ.objects.values_list("cnpj_formatado", "cnpj", "situacao")
        situacoes = {}
        for doc_fmt, cnpj_clean, sit in qs:
            situacoes[doc_fmt] = sit
            situacoes[cnpj_clean] = sit
        return situacoes

    def pre_calcular_concentracao(
        self, arquivo_ou_caminho: Any, doc_filtro: Optional[str] = None, papel_filtro: Optional[str] = None
    ) -> Tuple[Dict[str, Decimal], Dict[Tuple[str, str], Decimal], Dict[Tuple[str, str], Decimal]]:
        """
        Faz uma passada rápida de agregação para regras de concentração:
        - Total por fundo: doc_fundo -> soma
        - Total por sacado raiz: (doc_fundo, raiz_sacado) -> soma
        - Total por cedente: (doc_fundo, doc_cedente) -> soma
        Se doc_filtro for fornecido, linhas fora do escopo são ignoradas.
        """
        totais_fundo: Dict[str, Decimal] = {}
        totais_sacado: Dict[Tuple[str, str], Decimal] = {}
        totais_cedente: Dict[Tuple[str, str], Decimal] = {}

        doc_filtro_limpo = somente_digitos(doc_filtro) if doc_filtro else None

        leitor = self._obter_leitor_csv(arquivo_ou_caminho)
        for row in leitor:
            try:
                fundo = row["DOC_FUNDO"].strip()
                cedente = row["DOC_CEDENTE"].strip()

                if doc_filtro_limpo:
                    if papel_filtro == 'EMPRESA':
                        if somente_digitos(cedente) != doc_filtro_limpo:
                            continue
                    elif papel_filtro == 'GESTOR':
                        if somente_digitos(fundo) != doc_filtro_limpo:
                            continue

                sacado = row["DOC_SACADO"].strip()
                raiz_sac = raiz_cnpj(sacado)
                val = parse_decimal_br(row["VALOR_NOMINAL"])

                totais_fundo[fundo] = totais_fundo.get(fundo, Decimal(0)) + val
                totais_sacado[(fundo, raiz_sac)] = totais_sacado.get((fundo, raiz_sac), Decimal(0)) + val
                totais_cedente[(fundo, cedente)] = totais_cedente.get((fundo, cedente), Decimal(0)) + val
            except Exception:
                continue

        return totais_fundo, totais_sacado, totais_cedente

    def _obter_leitor_csv(self, arquivo_ou_caminho: Any) -> Iterator[Dict[str, str]]:
        """Garante gerador/iterator de linhas do CSV seja Path, str ou arquivo aberto."""
        if isinstance(arquivo_ou_caminho, (str, Path)):
            f = open(arquivo_ou_caminho, encoding="utf-8-sig", newline="")
            return csv.DictReader(f, delimiter=";")
        elif hasattr(arquivo_ou_caminho, "read"):
            if hasattr(arquivo_ou_caminho, "seek"):
                try:
                    arquivo_ou_caminho.seek(0)
                except Exception:
                    pass
            # Se já for texto (como StringIO)
            primeira_amostra = arquivo_ou_caminho.read(0)
            if isinstance(primeira_amostra, str):
                return csv.DictReader(arquivo_ou_caminho, delimiter=";")
            # Se for bytes
            texto = io.TextIOWrapper(arquivo_ou_caminho, encoding="utf-8-sig")
            return csv.DictReader(texto, delimiter=";")
        raise ValueError("Tipo de arquivo não suportado para leitura CSV.")

    @profile_performance("Ingestão CSV & Validação em Lote")
    def processar_arquivo(
        self,
        arquivo_ou_caminho: Any,
        nome_arquivo: str,
        caminho_log: Optional[Path] = None,
        doc_filtro: Optional[str] = None,
        papel_filtro: Optional[str] = None,
    ) -> Tuple[LoteImportacao, List[Dict[str, Any]], int]:
        """
        Executa a leitura sequencial, validação das notas e submissão ao banco.
        Se doc_filtro for fornecido, apenas notas cujo CNPJ do cedente ou fundo coincida
        são processadas; registros com outros CNPJs são ignorados e contabilizados em total_ignorados.
        Retorna (LoteImportacao, registros_log, total_ignorados).
        """
        # 1. Pré-cálculo para contexto de concentração
        totais_fundo, totais_sacado, totais_cedente = self.pre_calcular_concentracao(
            arquivo_ou_caminho, doc_filtro=doc_filtro, papel_filtro=papel_filtro
        )
        situacoes = self.carregar_situacoes_cadastrais()
        contexto = ContextoValidacao(
            data_base=self.data_base,
            situacoes_cnpj=situacoes,
            totais_fundo=totais_fundo,
            totais_sacado_fundo=totais_sacado,
            totais_cedente_fundo=totais_cedente,
        )

        # 2. Criar registro de Lote
        taxa_mensal = self.config_regras.get("precificacao", {}).get("taxa_mensal_percentual", 2.0)
        lote = LoteImportacao.objects.create(
            nome_arquivo=nome_arquivo,
            status=LoteImportacao.Status.PROCESSANDO,
            regras_aplicadas=self.config_regras,
            data_base=self.data_base,
            taxa_mensal_percentual=Decimal(str(taxa_mensal)),
            iniciado_em=timezone.now(),
        )

        # 3. Cache de hashes já existentes no banco para checagem rápida de duplicatas
        # hash_id -> status atual no banco
        hashes_no_banco = dict(
            Recebivel.objects.values_list("hash_id", "status")
        )
        # Hashes vistos dentro deste mesmo lote CSV
        hashes_no_lote: Set[str] = set()

        # Coleta de dados de fundos e cedentes para criação automática de contas e registros de população
        fundos_vistos: Dict[str, str] = {}
        cedentes_vistos: Dict[str, str] = {}

        registros_log: List[Dict[str, Any]] = []
        novos_recebiveis: List[Recebivel] = []
        recebiveis_para_atualizar: List[Recebivel] = []

        total_linhas = 0
        total_aprovados = 0
        total_barrados = 0
        total_ignorados = 0
        val_nom_total = Decimal(0)
        val_nom_aprov = Decimal(0)
        val_liq_aprov = Decimal(0)
        val_nom_barr = Decimal(0)

        doc_filtro_limpo = somente_digitos(doc_filtro) if doc_filtro else None

        leitor = self._obter_leitor_csv(arquivo_ou_caminho)
        chunk_size = getattr(settings, "ANTECIPE_CHUNK_SIZE", 5000)

        for num_linha, row in enumerate(leitor, start=2):
            doc_cedente = row.get("DOC_CEDENTE", "").strip()
            doc_fundo = row.get("DOC_FUNDO", "").strip()

            # Verificação estrita de pertinência de CNPJ caso doc_filtro esteja ativo
            if doc_filtro_limpo:
                if papel_filtro == 'EMPRESA':
                    if somente_digitos(doc_cedente) != doc_filtro_limpo:
                        total_ignorados += 1
                        continue
                elif papel_filtro == 'GESTOR':
                    if somente_digitos(doc_fundo) != doc_filtro_limpo:
                        total_ignorados += 1
                        continue

            total_linhas += 1
            nu_doc = row.get("NU_DOCUMENTO", "").strip()
            try:
                dt_venc = parse_data_br(row["DATA_VENCIMENTO_ORIGINAL"])
                dt_aquis = parse_data_br(row["DATA_AQUISICAO"])
                valor = parse_decimal_br(row["VALOR_NOMINAL"])
            except Exception as e:
                # Linha com layout inválido
                log_entry = {
                    "linha": num_linha,
                    "id": nu_doc,
                    "status": "BARRADO",
                    "barrado_por": ["LAYOUT_INVALIDO"],
                    "motivo": f"Erro de formatação de data/valor: {str(e)}",
                }
                registros_log.append(log_entry)
                continue

            val_nom_total += valor
            nome_fundo = row.get("NOME_FUNDO", "").strip()
            nome_cedente = row.get("NOME_CEDENTE", "").strip()
            doc_sacado = row["DOC_SACADO"].strip()
            tipo_rec = row["TIPO_RECEBIVEL"].strip()

            if nome_fundo and nome_fundo not in fundos_vistos:
                fundos_vistos[nome_fundo] = doc_fundo
            if nome_cedente and nome_cedente not in cedentes_vistos:
                cedentes_vistos[nome_cedente] = doc_cedente

            hash_id = gerar_hash_recebivel(doc_cedente, doc_sacado, nu_doc, dt_venc)

            # Prepara dados para o validador
            nota_dict = {
                "nu_documento": nu_doc,
                "doc_cedente": doc_cedente,
                "doc_sacado": doc_sacado,
                "doc_fundo": doc_fundo,
                "tipo_recebivel": tipo_rec,
                "valor_nominal": valor,
                "data_vencimento_original": dt_venc,
                "data_aquisicao": dt_aquis,
            }

            # 4. Avaliação das regras do fundo
            aprovada, barrados, motivo_str = self.motor.validar_nota(nota_dict, contexto)

            prazo_dias = None
            desconto = None
            valor_liq = None
            if aprovada:
                prazo_dias, desconto, valor_liq = self.motor.calcular_precificacao(
                    valor, dt_venc, self.data_base
                )

            status_calculado = Recebivel.Status.APROVADO if aprovada else Recebivel.Status.BARRADO

            # 5. Avaliação de DUPLICATAS conforme a regra da Época 1:
            # - Em caso de duplicata no mesmo lote ou já no banco:
            #   impede a submissão de nova linha.
            # - Exceção: já existe no banco com status BARRADO e a duplicata nova é aceitável (APROVADO):
            #   atualiza a nota existente.
            eh_duplicada_no_lote = hash_id in hashes_no_lote
            status_no_banco = hashes_no_banco.get(hash_id)

            if eh_duplicada_no_lote or (status_no_banco is not None):
                # É uma duplicata!
                if status_no_banco == Recebivel.Status.BARRADO and status_calculado == Recebivel.Status.APROVADO:
                    # EXCEÇÃO: Atualizar a nota existente no banco para APROVADO com os novos dados
                    rec_existente = Recebivel.objects.filter(hash_id=hash_id, status=Recebivel.Status.BARRADO).first()
                    if rec_existente:
                        rec_existente.lote = lote
                        rec_existente.linha = num_linha
                        rec_existente.status = Recebivel.Status.APROVADO
                        rec_existente.barrado_por = []
                        rec_existente.motivo_recusa = ""
                        rec_existente.prazo_dias = prazo_dias
                        rec_existente.desconto = desconto
                        rec_existente.valor_liquido = valor_liq
                        recebiveis_para_atualizar.append(rec_existente)
                        hashes_no_banco[hash_id] = Recebivel.Status.APROVADO

                    log_entry = {
                        "linha": num_linha,
                        "id": nu_doc,
                        "status": "APROVADO",
                        "atualizado_de_duplicata": True,
                    }
                    registros_log.append(log_entry)
                    total_aprovados += 1
                    val_nom_aprov += valor
                    val_liq_aprov += (valor_liq or Decimal(0))
                    continue
                else:
                    # Impedida a submissão de nova linha
                    log_entry = {
                        "linha": num_linha,
                        "id": nu_doc,
                        "status": "BARRADO",
                        "barrado_por": [Recebivel.CODIGO_DUPLICIDADE],
                        "motivo": "Nota duplicada impedida de submissão na tabela.",
                    }
                    registros_log.append(log_entry)
                    total_barrados += 1
                    val_nom_barr += valor
                    continue

            # Nota não duplicada: submete para a tabela
            hashes_no_lote.add(hash_id)
            hashes_no_banco[hash_id] = status_calculado

            rec = Recebivel(
                lote=lote,
                linha=num_linha,
                nome_fundo=row.get("NOME_FUNDO", "").strip(),
                doc_fundo=doc_fundo,
                nome_cedente=row.get("NOME_CEDENTE", "").strip(),
                doc_cedente=doc_cedente,
                nome_sacado=row.get("NOME_SACADO", "").strip(),
                doc_sacado=doc_sacado,
                nu_documento=nu_doc,
                tipo_recebivel=tipo_rec,
                valor_nominal=valor,
                data_vencimento_original=dt_venc,
                data_aquisicao=dt_aquis,
                raiz_cnpj_sacado=raiz_cnpj(doc_sacado),
                hash_id=hash_id,
                status=status_calculado,
                barrado_por=barrados,
                motivo_recusa=motivo_str,
                prazo_dias=prazo_dias,
                desconto=desconto,
                valor_liquido=valor_liq,
            )
            novos_recebiveis.append(rec)

            if aprovada:
                total_aprovados += 1
                val_nom_aprov += valor
                val_liq_aprov += (valor_liq or Decimal(0))
                registros_log.append({"linha": num_linha, "id": nu_doc, "status": "APROVADO"})
            else:
                total_barrados += 1
                val_nom_barr += valor
                registros_log.append({
                    "linha": num_linha,
                    "id": nu_doc,
                    "status": "BARRADO",
                    "barrado_por": barrados,
                })

            # Salva em chunks para eficiência de memória
            if len(novos_recebiveis) >= chunk_size:
                Recebivel.objects.bulk_create(novos_recebiveis, batch_size=chunk_size)
                novos_recebiveis.clear()

        # Despeja o restante
        if novos_recebiveis:
            Recebivel.objects.bulk_create(novos_recebiveis, batch_size=chunk_size)
            novos_recebiveis.clear()

        if recebiveis_para_atualizar:
            Recebivel.objects.bulk_update(
                recebiveis_para_atualizar,
                fields=["lote", "linha", "status", "barrado_por", "motivo_recusa", "prazo_dias", "desconto", "valor_liquido"],
            )

        # 6. Atualiza totais no lote
        lote.total_linhas = total_linhas
        lote.total_aprovados = total_aprovados
        lote.total_barrados = total_barrados
        lote.valor_nominal_total = val_nom_total
        lote.valor_nominal_aprovado = val_nom_aprov
        lote.valor_liquido_aprovado = val_liq_aprov
        lote.valor_nominal_barrado = val_nom_barr
        lote.status = LoteImportacao.Status.CONCLUIDO
        lote.finalizado_em = timezone.now()
        lote.save()

        # 7. População amigável: Criação de conta para cada fundo e cedente diferente inserido via CSV
        # Senha padrão: '123456'. Nome de usuário: nome do cedente / fundo.
        self._criar_contas_populacao(fundos=fundos_vistos, cedentes=cedentes_vistos)

        # 8. Gravação de log de registro em arquivo se solicitado
        if caminho_log:
            with open(caminho_log, "w", encoding="utf-8") as flog:
                json.dump(registros_log, flog, ensure_ascii=False, indent=2)

        return lote, registros_log, total_ignorados

    def _criar_contas_populacao(self, fundos: Dict[str, str], cedentes: Dict[str, str]) -> None:
        """
        Garante contas e registros nas tabelas Cedente e Fundo para cada par do lote importado:
        - Se o fundo ou cedente JÁ POSSUI cadastro, NENHUMA nova conta é criada e suas
          credenciais (senha e perfil existentes) são rigorosamente preservadas.
          Os recebíveis presentes no CSV aparecerão automaticamente em seu cadastro pré-existente.
        - Se o fundo ou cedente for NOVO, cria a conta com usuário=nome e senha padrão '123456',
          e cria o respectivo registro na tabela Fundo ou Cedente.
        """
        senha_padrao = "123456"

        for nome_fundo, doc_fundo in fundos.items():
            username = nome_fundo.strip()
            if not username:
                continue

            usuario_existente = User.objects.filter(username__iexact=username).first()
            if usuario_existente:
                user = usuario_existente
                if not hasattr(user, 'perfil'):
                    PerfilUsuario.objects.create(usuario=user, role=PerfilUsuario.Role.GESTOR)
            else:
                user = User.objects.create_user(
                    username=username,
                    password=senha_padrao,
                    first_name=username[:30],
                )
                PerfilUsuario.objects.create(usuario=user, role=PerfilUsuario.Role.GESTOR)

            # Garante o registro na tabela Fundo
            if not Fundo.objects.filter(usuario=user).exists():
                Fundo.objects.create(
                    usuario=user,
                    nome=nome_fundo,
                    codigo=doc_fundo or "92.234.400/0001-80",
                )

        for nome_cedente, doc_cedente in cedentes.items():
            username = nome_cedente.strip()
            if not username:
                continue

            usuario_existente = User.objects.filter(username__iexact=username).first()
            if usuario_existente:
                user = usuario_existente
                if not hasattr(user, 'perfil'):
                    PerfilUsuario.objects.create(usuario=user, role=PerfilUsuario.Role.EMPRESA)
            else:
                user = User.objects.create_user(
                    username=username,
                    password=senha_padrao,
                    first_name=username[:30],
                )
                PerfilUsuario.objects.create(usuario=user, role=PerfilUsuario.Role.EMPRESA)

            # Garante o registro na tabela Cedente
            if not Cedente.objects.filter(usuario=user).exists():
                Cedente.objects.create(
                    usuario=user,
                    nome=nome_cedente,
                    codigo=doc_cedente or "",
                )


