#!/usr/bin/env python3
"""
Script de Inicialização e Setup do Antecipe FIDC.
Configura o banco de dados e cria automaticamente a conta de Administrador Geral ('admin').
"""

import os
import sys
from pathlib import Path

# Se não estiver rodando no venv do backend, tenta invocar o python do backend/.venv
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
VENV_PYTHON = BACKEND_DIR / ".venv" / "bin" / "python"

if VENV_PYTHON.exists() and sys.executable != str(VENV_PYTHON):
    import subprocess
    result = subprocess.run([str(VENV_PYTHON), str(Path(__file__).resolve())] + sys.argv[1:])
    sys.exit(result.returncode)

sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from django.core.management import call_command
from django.contrib.auth.models import User
from core.models import PerfilUsuario, Fundo

def setup_admin():
    print("=" * 60)
    print("  🚀 ANTECIPE FIDC - SETUP DO BANCO E CONTA ADMINISTRADOR")
    print("=" * 60)

    print("\n[1/3] Aplicando migrações do banco de dados PostgreSQL...")
    call_command("migrate", interactive=False)

    print("\n[2/3] Carregando base de apoio da Receita Federal (CNPJs mock)...")
    try:
        call_command("carregar_situacao_cadastral")
    except Exception as e:
        print(f"  (Aviso) Não foi possível carregar base de apoio ou já carregada: {e}")

    print("\n[3/3] Criando/atualizando conta de Administrador Geral ('admin')...")
    ADMIN_USERNAME = "admin"
    ADMIN_PASSWORD = "password123"
    ADMIN_EMAIL = "admin@antecipe.com"

    user, created = User.objects.get_or_create(
        username=ADMIN_USERNAME,
        defaults={
            "email": ADMIN_EMAIL,
            "first_name": "Administrador",
            "last_name": "Geral",
            "is_staff": True,
            "is_superuser": True,
        },
    )
    user.set_password(ADMIN_PASSWORD)
    user.email = ADMIN_EMAIL
    user.is_staff = True
    user.is_superuser = True
    user.save()

    perfil, _ = PerfilUsuario.objects.get_or_create(usuario=user)
    perfil.role = PerfilUsuario.Role.GESTOR
    perfil.save()

    fundo_obj, _ = Fundo.objects.get_or_create(
        usuario=user,
        defaults={
            "nome": "ANTECIPE GESTORA GLOBAL FIDC",
            "codigo": "92.234.400/0001-80",
        },
    )
    fundo_obj.nome = "ANTECIPE GESTORA GLOBAL FIDC"
    fundo_obj.codigo = "92.234.400/0001-80"
    fundo_obj.save()

    status_str = "CRIADA com sucesso!" if created else "ATUALIZADA com sucesso!"

    print("\n" + "=" * 60)
    print(f"  ✓ CONTA DO ADMINISTRADOR {status_str}")
    print("=" * 60)
    print(f"  • Usuário : {ADMIN_USERNAME}")
    print(f"  • Senha   : {ADMIN_PASSWORD}")
    print(f"  • Perfil  : GESTOR (Super Administrador)")
    print("=" * 60)
    print("\nPronto! Agora você pode iniciar o backend e frontend.")

if __name__ == "__main__":
    setup_admin()
