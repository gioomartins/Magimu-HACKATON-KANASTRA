"""
Testes das Épocas 0 e 1:
- Constraints de modelo e hash de idempotência
- Motor de regras Strategy e precificação financeira
- Ingestão de CSV, detecção e atualização de duplicatas
- Endpoints REST com paginação de 20 em 20
"""

import io
import json
from datetime import date
from decimal import Decimal
from io import StringIO
from pathlib import Path
from tempfile import NamedTemporaryFile

from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.models import LoteImportacao, Recebivel, SituacaoCadastralCNPJ
from core.rules_engine import ContextoValidacao, MotorDeRegras
from core.services import ImportadorCSVService
from core.utils import gerar_hash_recebivel, raiz_cnpj, somente_digitos


def novo_lote(**kwargs) -> LoteImportacao:
    return LoteImportacao.objects.create(
        nome_arquivo=kwargs.pop('nome_arquivo', 'lote.csv'), data_base=date(2026, 10, 22), **kwargs
    )


def novo_recebivel(lote: LoteImportacao, linha: int, **kwargs) -> Recebivel:
    dados = dict(
        nome_fundo='ANTECIPE FIDC',
        doc_fundo='92.234.400/0001-80',
        nome_cedente='NLR INDÚSTRIA DE ESTOFADOS LTDA ME',
        doc_cedente='10.062.050/0001-57',
        nome_sacado='TECIDOS SANTARÉM LTDA ME',
        doc_sacado='22.144.961/0001-02',
        nu_documento='725714',
        tipo_recebivel='Duplicata',
        valor_nominal=Decimal('2278.08'),
        data_vencimento_original=date(2026, 11, 7),
        data_aquisicao=date(2026, 4, 27),
    )
    dados.update(kwargs)
    return Recebivel.objects.create(lote=lote, linha=linha, **dados)


class UtilsTests(TestCase):
    def test_normalizacao_cnpj(self):
        self.assertEqual(somente_digitos('92.234.400/0001-80'), '92234400000180')
        self.assertEqual(raiz_cnpj('92.234.400/0001-80'), '92234400')

    def test_hash_ignora_mascara_e_caixa(self):
        venc = date(2026, 11, 7)
        a = gerar_hash_recebivel('10.062.050/0001-57', '22.144.961/0001-02', 'nc-01', venc)
        b = gerar_hash_recebivel('10062050000157', '22144961000102', ' NC-01 ', venc)
        self.assertEqual(a, b)
        self.assertEqual(len(a), 64)

    def test_parcelas_com_vencimentos_diferentes_tem_hash_diferente(self):
        args = ('10.062.050/0001-57', '22.144.961/0001-02', '725714')
        self.assertNotEqual(
            gerar_hash_recebivel(*args, date(2026, 11, 7)),
            gerar_hash_recebivel(*args, date(2026, 12, 7)),
        )


class RecebivelConstraintsTests(TestCase):
    def setUp(self):
        self.lote = novo_lote()

    def test_save_preenche_campos_derivados(self):
        r = novo_recebivel(self.lote, 2)
        self.assertEqual(r.raiz_cnpj_sacado, '22144961')
        self.assertEqual(len(r.hash_id), 64)

    def test_mesma_nota_nao_pode_ser_aprovada_duas_vezes(self):
        novo_recebivel(self.lote, 2, status='APROVADO', valor_liquido=Decimal('2200'))
        outro_lote = novo_lote(nome_arquivo='reenvio.csv')
        with self.assertRaises(IntegrityError), transaction.atomic():
            novo_recebivel(outro_lote, 2, status='APROVADO', valor_liquido=Decimal('2200'))

    def test_duplicata_barrada_pode_ser_gravada(self):
        novo_recebivel(self.lote, 2, status='APROVADO', valor_liquido=Decimal('2200'))
        dup = novo_recebivel(
            self.lote, 3, status='BARRADO', barrado_por=[Recebivel.CODIGO_DUPLICIDADE],
            motivo_recusa='Nota já antecipada ou em duplicidade no lote atual.',
        )
        self.assertEqual(Recebivel.objects.filter(hash_id=dup.hash_id).count(), 2)


class MotorDeRegrasTests(TestCase):
    def setUp(self):
        self.config = {
            "validadores": [
                {"codigo": "TIPO_RECEBIVEL", "ativo": True, "parametros": {"tipos_aceitos": ["Duplicata"]}},
                {"codigo": "VALOR_MINIMO", "ativo": True, "parametros": {"valor_minimo": 100.0}},
                {"codigo": "PRAZO_MAXIMO", "ativo": True, "parametros": {"prazo_maximo_dias": 180}},
                {"codigo": "PRAZO_MINIMO", "ativo": False, "parametros": {"prazo_minimo_dias": 30}},
            ],
            "precificacao": {
                "taxa_mensal_percentual": 2.0,
                "base_dias": 30
            }
        }
        self.motor = MotorDeRegras(self.config)
        self.contexto = ContextoValidacao(data_base=date(2026, 10, 22))

    def test_nota_aprovada_com_precificacao(self):
        nota = {
            "nu_documento": "NF-100",
            "tipo_recebivel": "Duplicata",
            "valor_nominal": Decimal("1000.00"),
            "data_vencimento_original": date(2026, 11, 21), # 30 dias
            "data_aquisicao": date(2026, 10, 1),
        }
        aprovada, barrados, motivo = self.motor.validar_nota(nota, self.contexto)
        self.assertTrue(aprovada)
        self.assertEqual(barrados, [])

        dias, desc, liq = self.motor.calcular_precificacao(nota["valor_nominal"], nota["data_vencimento_original"], date(2026, 10, 22))
        self.assertEqual(dias, 30)
        self.assertEqual(desc, Decimal("20.00")) # 2% de 1000
        self.assertEqual(liq, Decimal("980.00"))

    def test_nota_barrada_por_tipo_e_prazo(self):
        nota = {
            "nu_documento": "NF-200",
            "tipo_recebivel": "Cheque",
            "valor_nominal": Decimal("500.00"),
            "data_vencimento_original": date(2027, 6, 1), # > 180 dias
            "data_aquisicao": date(2026, 10, 1),
        }
        aprovada, barrados, motivo = self.motor.validar_nota(nota, self.contexto)
        self.assertFalse(aprovada)
        self.assertIn("TIPO_RECEBIVEL", barrados)
        self.assertIn("PRAZO_MAXIMO", barrados)


class ImportadorCSVServiceTests(TestCase):
    def test_importacao_com_duplicata_e_atualizacao(self):
        csv_conteudo_1 = (
            "NOME_FUNDO;DOC_FUNDO;NOME_CEDENTE;DOC_CEDENTE;NOME_SACADO;DOC_SACADO;NU_DOCUMENTO;TIPO_RECEBIVEL;VALOR_NOMINAL;DATA_VENCIMENTO_ORIGINAL;DATA_AQUISICAO\n"
            "ANTECIPE FIDC;92.234.400/0001-80;EMPRESA A;10.062.050/0001-57;CLIENTE B;22.144.961/0001-02;DOC-1;Cheque;500,00;20/11/2026;10/10/2026\n"
        )
        service = ImportadorCSVService()
        # Desativa temporariamente a regra de concentração neste teste unitário de 1 linha
        service.config_regras["validadores"] = [
            {"codigo": "TIPO_RECEBIVEL", "ativo": True, "parametros": {"tipos_aceitos": ["Duplicata"]}},
            {"codigo": "VALOR_MINIMO", "ativo": True, "parametros": {"valor_minimo": 100.0}},
        ]
        service.motor = MotorDeRegras(service.config_regras)

        f1 = io.StringIO(csv_conteudo_1)
        lote1, log1 = service.processar_arquivo(f1, "lote1.csv")

        # Primeiro envio: barrado por TIPO_RECEBIVEL (Cheque)
        self.assertEqual(Recebivel.objects.count(), 1)
        rec = Recebivel.objects.first()
        self.assertEqual(rec.status, Recebivel.Status.BARRADO)
        self.assertIn("TIPO_RECEBIVEL", rec.barrado_por)

        # Segundo envio: mesmo documento, agora como Duplicata (aceitável)
        # Deve acionar a EXCEÇÃO da Época 1: atualizar a nota barrada existente para APROVADA
        csv_conteudo_2 = (
            "NOME_FUNDO;DOC_FUNDO;NOME_CEDENTE;DOC_CEDENTE;NOME_SACADO;DOC_SACADO;NU_DOCUMENTO;TIPO_RECEBIVEL;VALOR_NOMINAL;DATA_VENCIMENTO_ORIGINAL;DATA_AQUISICAO\n"
            "ANTECIPE FIDC;92.234.400/0001-80;EMPRESA A;10.062.050/0001-57;CLIENTE B;22.144.961/0001-02;DOC-1;Duplicata;500,00;20/11/2026;10/10/2026\n"
        )
        f2 = io.StringIO(csv_conteudo_2)
        lote2, log2 = service.processar_arquivo(f2, "lote2.csv")

        # Não deve criar nova linha, deve atualizar a existente
        self.assertEqual(Recebivel.objects.count(), 1)
        rec.refresh_from_db()
        self.assertEqual(rec.status, Recebivel.Status.APROVADO)
        self.assertIsNotNone(rec.valor_liquido)

        # Terceiro envio: tentativa de enviar novamente uma nota já APROVADA
        # Deve impedir a submissão (duplicata de aprovada)
        f3 = io.StringIO(csv_conteudo_2)
        lote3, log3 = service.processar_arquivo(f3, "lote3.csv")
        self.assertEqual(Recebivel.objects.count(), 1)
        self.assertEqual(lote3.total_barrados, 1)


class RecebivelAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.lote = novo_lote()
        # Criar 25 recebíveis para testar paginação de 20 em 20
        recs = []
        for i in range(1, 26):
            r = Recebivel(
                lote=self.lote,
                linha=i,
                nome_fundo='ANTECIPE FIDC',
                doc_fundo='92.234.400/0001-80',
                nome_cedente='CEDENTE',
                doc_cedente='10.062.050/0001-57',
                nome_sacado='SACADO',
                doc_sacado='22.144.961/0001-02',
                nu_documento=f'NF-{i}',
                tipo_recebivel='Duplicata',
                valor_nominal=Decimal('1000.00'),
                data_vencimento_original=date(2026, 11, 7),
                data_aquisicao=date(2026, 4, 27),
                raiz_cnpj_sacado='22144961',
                hash_id=f'hash_{i}',
                status=Recebivel.Status.APROVADO,
                valor_liquido=Decimal('980.00'),
            )
            recs.append(r)
        Recebivel.objects.bulk_create(recs)

    def test_paginacao_de_20_em_20(self):
        res = self.client.get('/api/recebiveis/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        dados = res.json()
        self.assertEqual(dados['count'], 25)
        self.assertEqual(len(dados['results']), 20)
        self.assertIsNotNone(dados['next'])

        # Página 2 deve trazer os 5 restantes
        res2 = self.client.get('/api/recebiveis/?page=2')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        dados2 = res2.json()
        self.assertEqual(len(dados2['results']), 5)

    def test_insercao_atualizacao_selecao_drf(self):
        # Inserção (POST)
        novo_payload = {
            "lote": str(self.lote.id),
            "linha": 99,
            "nome_fundo": "FUNDO X",
            "doc_fundo": "92.234.400/0001-80",
            "nome_cedente": "CEDENTE NOVO",
            "doc_cedente": "10.062.050/0001-57",
            "nome_sacado": "SACADO NOVO",
            "doc_sacado": "22.144.961/0001-02",
            "nu_documento": "NF-999",
            "tipo_recebivel": "Duplicata",
            "valor_nominal": "1500.00",
            "data_vencimento_original": "2026-11-20",
            "data_aquisicao": "2026-10-01",
            "raiz_cnpj_sacado": "22144961",
            "hash_id": "hash_manual_999",
            "status": "APROVADO",
            "valor_liquido": "1450.00",
        }
        res_post = self.client.post('/api/recebiveis/', novo_payload, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)
        rec_id = res_post.json()['id']

        # Atualização (PATCH)
        res_patch = self.client.patch(f'/api/recebiveis/{rec_id}/', {'valor_nominal': '1800.00'}, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(res_patch.json()['valor_nominal']), Decimal('1800.00'))

        # Seleção detalhe (GET)
        res_get = self.client.get(f'/api/recebiveis/{rec_id}/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(res_get.json()['nu_documento'], 'NF-999')

    def test_regras_endpoint_get_e_post(self):
        # Teste GET /api/regras/
        res_get = self.client.get('/api/regras/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertIn('validadores', res_get.json())

        # Teste POST /api/regras/ atualizando configuração
        regras_atuais = res_get.json()
        res_post = self.client.post('/api/regras/', regras_atuais, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_200_OK)
        self.assertIn('mensagem', res_post.json())
        self.assertIn('total_reprecificadas', res_post.json())

