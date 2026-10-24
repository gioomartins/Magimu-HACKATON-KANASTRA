"""
Carrega a base de situação cadastral de CNPJs (cnpj_situacao_mock.csv) no PostgreSQL.

Uso:
    uv run python manage.py carregar_situacao_cadastral
    uv run python manage.py carregar_situacao_cadastral --arquivo /caminho/outro.csv

É idempotente: pode ser executado várias vezes (faz upsert pelo CNPJ).
"""

import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from core.models import SituacaoCadastralCNPJ
from core.utils import somente_digitos


class Command(BaseCommand):
    help = 'Carrega/atualiza a tabela de situação cadastral de CNPJs a partir do CSV mock.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--arquivo',
            type=Path,
            default=settings.ANTECIPE_SITUACAO_CNPJ_PATH,
            help='CSV com as colunas DOC;SITUACAO_CADASTRAL (padrão: cnpj_situacao_mock.csv na raiz).',
        )

    def handle(self, *args, arquivo: Path, **options):
        if not arquivo.exists():
            raise CommandError(f'Arquivo não encontrado: {arquivo}')

        registros: dict[str, SituacaoCadastralCNPJ] = {}
        with arquivo.open(encoding='utf-8-sig', newline='') as f:
            leitor = csv.DictReader(f, delimiter=';')
            esperadas = {'DOC', 'SITUACAO_CADASTRAL'}
            if not esperadas.issubset(leitor.fieldnames or []):
                raise CommandError(f'Cabeçalho inválido. Esperado: {sorted(esperadas)}')

            for linha in leitor:
                cnpj = somente_digitos(linha['DOC'])
                if len(cnpj) != 14:
                    self.stderr.write(f'Ignorando documento inválido: {linha["DOC"]!r}')
                    continue
                registros[cnpj] = SituacaoCadastralCNPJ(
                    cnpj=cnpj,
                    cnpj_formatado=linha['DOC'].strip(),
                    situacao=linha['SITUACAO_CADASTRAL'].strip().upper(),
                )

        with transaction.atomic():
            SituacaoCadastralCNPJ.objects.bulk_create(
                registros.values(),
                batch_size=5000,
                update_conflicts=True,
                unique_fields=['cnpj'],
                update_fields=['cnpj_formatado', 'situacao', 'atualizado_em'],
            )

        self.stdout.write(
            self.style.SUCCESS(f'{len(registros)} CNPJs carregados de {arquivo.name}.')
        )
