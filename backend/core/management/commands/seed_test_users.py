import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import PerfilUsuario


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
            },
            {
                "username": "empresa_demo",
                "email": "empresa@antecipe.com",
                "password": "password123",
                "role": PerfilUsuario.Role.EMPRESA,
                "first_name": "Empresa",
                "last_name": "Demo",
            },
            {
                "username": "gestor_demo",
                "email": "gestor@antecipe.com",
                "password": "password123",
                "role": PerfilUsuario.Role.GESTOR,
                "first_name": "Gestor",
                "last_name": "FIDC",
            },
            {
                "username": "fundo_demo",
                "email": "fundo@antecipe.com",
                "password": "password123",
                "role": PerfilUsuario.Role.GESTOR,
                "first_name": "Fundo",
                "last_name": "Demo",
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

            status_str = "criado" if created else "atualizado"
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Usuário '{user.username}' ({perfil.role}) {status_str} com sucesso! Senha: '{u_data['password']}'"
                )
            )
