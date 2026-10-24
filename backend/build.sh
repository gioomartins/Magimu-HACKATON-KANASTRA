#!/usr/bin/env bash
set -o errexit

# Instala o uv globalmente no container do Render
pip install uv

# Instala as dependências usando o uv (compatível com requirements.txt ou pyproject.toml)
uv pip install --system -r requirements.txt

# Coleta arquivos estáticos do Django
python manage.py collectstatic --no-input

# Executa as migrações no banco PostgreSQL
python manage.py migrate