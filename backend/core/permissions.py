"""
Permissões de controle de acesso baseado em papéis (RBAC) para o Antecipe.
"""

from rest_framework import permissions
from core.models import PerfilUsuario


class IsGestor(permissions.BasePermission):
    """
    Permissão que restringe o acesso exclusivamente a usuários com papel de GESTOR.
    Utilizada para proteção de leitura e escrita nas regras e precificação do FIDC.
    """
    message = "Acesso restrito a Gestores do Fundo."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        perfil = getattr(request.user, 'perfil', None)
        return bool(perfil and perfil.role == PerfilUsuario.Role.GESTOR)


class IsEmpresaOrGestor(permissions.BasePermission):
    """
    Permite acesso a qualquer usuário autenticado com perfil válido (EMPRESA ou GESTOR).
    """
    message = "Autenticação necessária para realizar esta operação."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        perfil = getattr(request.user, 'perfil', None)
        return bool(perfil and perfil.role in [PerfilUsuario.Role.EMPRESA, PerfilUsuario.Role.GESTOR])
