from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Cedente, Fundo, PerfilUsuario


class Command(BaseCommand):
    help = "Cria ou reseta as credenciais padrão de teste para Cedente (Empresa) e Fundo (Gestor)"

    def handle(self, *args, **options):
        users_to_seed = [
            {
                "username": "cedente_demo",
                "email": "cedente@antecipe.com",
                "password": "password123",
                "role": PerfilUsuario.Role.EMPRESA,
                "first_name": "Ana",
                "last_name": "Cedente",
                "nome_entidade": "Ana Indústria e Comércio LTDA",
                "cnpj": "10.062.050/0001-57",
            },
            {
                "username": "empresa_demo",
                "email": "empresa@antecipe.com",
                "password": "password123",
                "role": PerfilUsuario.Role.EMPRESA,
                "first_name": "Empresa",
                "last_name": "Demo",
                "nome_entidade": "NLR INDÚSTRIA DE ESTOFADOS LTDA ME",
                "cnpj": "10.062.050/0001-57",
            },
            {
                "username": "gestor_demo",
                "email": "gestor@antecipe.com",
                "password": "password123",
                "role": PerfilUsuario.Role.GESTOR,
                "first_name": "Gestor",
                "last_name": "FIDC",
                "nome_entidade": "ANTECIPE FIDC",
                "cnpj": "92.234.400/0001-80",
            },
            {
                "username": "fundo_demo",
                "email": "fundo@antecipe.com",
                "password": "password123",
                "role": PerfilUsuario.Role.GESTOR,
                "first_name": "Fundo",
                "last_name": "Demo",
                "nome_entidade": "ANTECIPE CRÉDITO FIDC MULTISETORIAL",
                "cnpj": "92.234.400/0001-80",
            },
            {
                "username": "admin",
                "email": "admin@antecipe.com",
                "password": "password123",
                "role": PerfilUsuario.Role.GESTOR,
                "first_name": "Administrador",
                "last_name": "Gerente",
                "nome_entidade": "ANTECIPE GESTORA GLOBAL FIDC",
                "cnpj": "92.234.400/0001-80",
            },
        ]

        for u_data in users_to_seed:
            user, created = User.objects.get_or_create(
                username=u_data["username"],
                defaults={
                    "email": u_data["email"],
                    "first_name": u_data["first_name"],
                    "last_name": u_data["last_name"],
                },
            )
            user.set_password(u_data["password"])
            user.email = u_data["email"]
            user.save()

            perfil, _ = PerfilUsuario.objects.get_or_create(usuario=user)
            perfil.role = u_data["role"]
            perfil.save()

            # Popula ou atualiza tabela Cedente ou Fundo
            if u_data["role"] == PerfilUsuario.Role.EMPRESA:
                cedente_obj, _ = Cedente.objects.get_or_create(
                    usuario=user,
                    defaults={
                        "nome": u_data["nome_entidade"],
                        "codigo": u_data["cnpj"],
                    },
                )
                cedente_obj.nome = u_data["nome_entidade"]
                cedente_obj.codigo = u_data["cnpj"]
                cedente_obj.save()
            elif u_data["role"] == PerfilUsuario.Role.GESTOR:
                fundo_obj, _ = Fundo.objects.get_or_create(
                    usuario=user,
                    defaults={
                        "nome": u_data["nome_entidade"],
                        "codigo": u_data["cnpj"],
                    },
                )
                fundo_obj.nome = u_data["nome_entidade"]
                fundo_obj.codigo = u_data["cnpj"]
                fundo_obj.save()

            status_str = "criado" if created else "atualizado"
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Usuário '{user.username}' ({perfil.role}) {status_str} com sucesso! Entidade: '{u_data['nome_entidade']}'"
                )
            )
