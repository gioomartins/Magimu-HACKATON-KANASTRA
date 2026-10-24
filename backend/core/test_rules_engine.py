"""
Testes unitários focados exclusivamente no motor de regras de negócio (Core)
e controle de acesso RBAC do sistema Antecipe FIDC.
"""

from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.models import PerfilUsuario
from core.rules_engine import (
    ContextoValidacao,
    MotorDeRegras,
    ValidadorDuplicidade,
    ValidadorValorMinimo,
)


class RulesEngineCoreTests(TestCase):
    """
    Testes das regras de negócio do motor de crédito do Antecipe FIDC.
    """

    def setUp(self):
        self.data_base = date(2026, 10, 24)
        self.config_padrao = {
            "fundo": {"nome": "ANTECIPE FIDC", "cnpj": "92.234.400/0001-80"},
            "validadores": [
                {
                    "codigo": "VALOR_MINIMO",
                    "ativo": True,
                    "parametros": {"valor_minimo": 500.0},
                },
                {
                    "codigo": "DUPLICIDADE",
                    "ativo": True,
                    "parametros": {},
                },
            ],
            "precificacao": {
                "metodo": "DESCONTO_SIMPLES",
                "taxa_mensal_percentual": 2.0,
                "base_dias": 30,
            },
        }
        self.motor = MotorDeRegras(self.config_padrao)

    def test_1_calculo_desconto_simples_matematicamente_correto(self):
        """
        Teste 1: Garantir que o cálculo de Desconto Simples Comercial (pró-rata die)
        está matematicamente exato:
        Fórmula: Desconto = Valor_Nominal * (Taxa_Mensal% / 100) * (Dias / base_dias)
        Valor Líquido = Valor_Nominal - Desconto
        """
        valor_nominal = Decimal("10000.00")
        # Vencimento em 15 dias após a data-base (24/10/2026 -> 08/11/2026)
        data_vencimento = date(2026, 11, 8)

        # Taxa mensal = 2.0% ao mês. Base = 30 dias.
        # Prazo = 15 dias.
        # Taxa efetiva = 0.02 * (15 / 30) = 0.01 (1.0%)
        # Desconto esperado = 10000.00 * 0.01 = 100.00
        # Valor líquido esperado = 10000.00 - 100.00 = 9900.00
        prazo_dias, desconto, valor_liquido = self.motor.calcular_precificacao(
            valor_nominal=valor_nominal,
            data_vencimento=data_vencimento,
            data_base=self.data_base,
        )

        self.assertEqual(prazo_dias, 15)
        self.assertEqual(desconto, Decimal("100.00"))
        self.assertEqual(valor_liquido, Decimal("9900.00"))
        self.assertEqual(valor_nominal - desconto, valor_liquido)

        # Teste adicional: vencimento no mesmo dia (prazo zero)
        dias_zero, desc_zero, liq_zero = self.motor.calcular_precificacao(
            valor_nominal=valor_nominal,
            data_vencimento=self.data_base,
            data_base=self.data_base,
        )
        self.assertEqual(dias_zero, 0)
        self.assertEqual(desc_zero, Decimal("0.00"))
        self.assertEqual(liq_zero, valor_nominal)

    def test_2_validador_duplicidade_barra_notas_com_mesmo_hash_id(self):
        """
        Teste 2: Garantir que o ValidadorDuplicidade barra recebíveis com hash_id
        que já existe no conjunto de aprovados do contexto.
        """
        hash_ja_aprovado = "hash_sha256_duplicado_teste_123"
        validador_dup = ValidadorDuplicidade({})
        contexto = ContextoValidacao(
            data_base=self.data_base,
            hashes_aprovados={hash_ja_aprovado},
        )

        # 1. Nota com hash idêntico ao já aprovado deve ser BARRADA
        nota_duplicada = {"hash_id": hash_ja_aprovado, "nu_documento": "NF-1001"}
        resultado_duplicada = validador_dup.validar(nota_duplicada, contexto)
        self.assertIsNotNone(resultado_duplicada)
        codigo, motivo = resultado_duplicada
        self.assertEqual(codigo, "DUPLICIDADE")
        self.assertIn("Nota duplicada com hash_id", motivo)

        # 2. Nota com hash novo / inédito deve ser APROVADA (None)
        nota_inedita = {"hash_id": "hash_inedito_456", "nu_documento": "NF-1002"}
        resultado_inedita = validador_dup.validar(nota_inedita, contexto)
        self.assertIsNone(resultado_inedita)

    def test_3_regra_valor_minimo_recusa_abaixo_e_aprova_acima(self):
        """
        Teste 3: Garantir que a regra VALOR_MINIMO recusa notas abaixo do piso
        e aprova notas acima ou iguais ao piso.
        Piso configurado = R$ 500.00
        """
        validador_minimo = ValidadorValorMinimo({"valor_minimo": 500.0})
        contexto = ContextoValidacao(data_base=self.data_base)

        # Caso A: Nota abaixo do piso (R$ 499.99) -> Deve ser RECUSADA
        nota_abaixo = {"valor_nominal": Decimal("499.99")}
        res_abaixo = validador_minimo.validar(nota_abaixo, contexto)
        self.assertIsNotNone(res_abaixo)
        cod_abaixo, mot_abaixo = res_abaixo
        self.assertEqual(cod_abaixo, "VALOR_MINIMO")
        self.assertIn("inferior ao valor mínimo", mot_abaixo)

        # Caso B: Nota exatamente no piso (R$ 500.00) -> Deve ser APROVADA
        nota_exata = {"valor_nominal": Decimal("500.00")}
        res_exata = validador_minimo.validar(nota_exata, contexto)
        self.assertIsNone(res_exata)

        # Caso C: Nota bem acima do piso (R$ 15.000,00) -> Deve ser APROVADA
        nota_acima = {"valor_nominal": Decimal("15000.00")}
        res_acima = validador_minimo.validar(nota_acima, contexto)
        self.assertIsNone(res_acima)


class AuthAndRbacTests(TestCase):
    """
    Testes de autenticação JWT e controle de acesso baseado em papéis (RBAC).
    """

    def setUp(self):
        self.client = APIClient()

    def test_registro_e_login_jwt_gestor_e_empresa(self):
        # 1. Registrar usuário EMPRESA
        res_reg_empresa = self.client.post(
            '/api/auth/register/',
            {'username': 'empresa1', 'password': 'senha123_empresa', 'role': 'EMPRESA'},
            format='json',
        )
        self.assertEqual(res_reg_empresa.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_reg_empresa.json()['role'], 'EMPRESA')
        self.assertIn('token', res_reg_empresa.json())

        # 2. Registrar usuário GESTOR
        res_reg_gestor = self.client.post(
            '/api/auth/register/',
            {'username': 'gestor1', 'password': 'senha123_gestor', 'role': 'GESTOR'},
            format='json',
        )
        self.assertEqual(res_reg_gestor.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_reg_gestor.json()['role'], 'GESTOR')

        # 3. Login usuário GESTOR
        res_login = self.client.post(
            '/api/auth/login/',
            {'username': 'gestor1', 'password': 'senha123_gestor'},
            format='json',
        )
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        dados_login = res_login.json()
        self.assertEqual(dados_login['role'], 'GESTOR')
        self.assertIn('token', dados_login)

        # 4. Login com senha errada
        res_login_invalido = self.client.post(
            '/api/auth/login/',
            {'username': 'gestor1', 'password': 'senha_errada'},
            format='json',
        )
        self.assertEqual(res_login_invalido.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rbac_protecao_rota_regras_apenas_gestor(self):
        # Cria gestor e empresa
        u_gestor = User.objects.create_user(username='g_user', password='pwd')
        PerfilUsuario.objects.create(usuario=u_gestor, role=PerfilUsuario.Role.GESTOR)

        u_empresa = User.objects.create_user(username='e_user', password='pwd')
        PerfilUsuario.objects.create(usuario=u_empresa, role=PerfilUsuario.Role.EMPRESA)

        # 1. Acesso anônimo deve ser negado (401)
        res_anon = self.client.get('/api/regras/')
        self.assertIn(res_anon.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        # 2. Acesso com perfil EMPRESA deve ser negado (403)
        self.client.force_authenticate(user=u_empresa)
        res_empresa = self.client.get('/api/regras/')
        self.assertEqual(res_empresa.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Acesso com perfil GESTOR deve ser permitido (200)
        self.client.force_authenticate(user=u_gestor)
        res_gestor = self.client.get('/api/regras/')
        self.assertEqual(res_gestor.status_code, status.HTTP_200_OK)
