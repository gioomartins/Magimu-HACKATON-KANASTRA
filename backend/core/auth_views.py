"""
Views de Autenticação JWT e RBAC (Registro, Login e Perfil).
"""

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import PerfilUsuario


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Endpoint de criação de conta (/api/auth/register/).
    Recebe username, password e role ('GESTOR' ou 'EMPRESA').
    Retorna os tokens JWT e a role do usuário.
    """
    data = request.data
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    role = (data.get('role') or 'EMPRESA').strip().upper()

    if not username or not password:
        return Response(
            {'erro': 'Nome de usuário e senha são obrigatórios.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if role not in [PerfilUsuario.Role.GESTOR, PerfilUsuario.Role.EMPRESA]:
        return Response(
            {'erro': f"Perfil inválido. Escolha '{PerfilUsuario.Role.GESTOR}' ou '{PerfilUsuario.Role.EMPRESA}'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'erro': 'Este nome de usuário já está em uso.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Cria o usuário e o perfil associado
    user = User.objects.create_user(username=username, password=password)
    perfil = PerfilUsuario.objects.create(usuario=user, role=role)

    # Gera tokens JWT com claims adicionais de role
    refresh = RefreshToken.for_user(user)
    refresh['role'] = perfil.role
    refresh['username'] = user.username

    return Response(
        {
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'role': perfil.role,
            'mensagem': 'Conta criada com sucesso!',
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Endpoint de login (/api/auth/login/).
    Recebe username e password.
    Retorna os tokens JWT e a role do usuário autenticado.
    """
    data = request.data
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    if not username or not password:
        return Response(
            {'erro': 'Informe usuário e senha.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {'erro': 'Credenciais inválidas. Verifique seu usuário e senha.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    perfil, _ = PerfilUsuario.objects.get_or_create(usuario=user, defaults={'role': PerfilUsuario.Role.EMPRESA})

    refresh = RefreshToken.for_user(user)
    refresh['role'] = perfil.role
    refresh['username'] = user.username

    return Response(
        {
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'role': perfil.role,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Retorna os dados do usuário autenticado via token JWT.
    """
    perfil, _ = PerfilUsuario.objects.get_or_create(usuario=request.user, defaults={'role': PerfilUsuario.Role.EMPRESA})
    return Response({
        'username': request.user.username,
        'role': perfil.role,
    })
