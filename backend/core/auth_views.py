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

from core.models import Cedente, Fundo, PerfilUsuario


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Endpoint de criação de conta (/api/auth/register/).
    Recebe username, password, role ('GESTOR' ou 'EMPRESA'), nome e cnpj.
    - Se EMPRESA: cadastra na tabela User e na tabela Cedente.
    - Se GESTOR: cadastra na tabela User e na tabela Fundo.
    Retorna os tokens JWT e os dados do usuário.
    """
    data = request.data
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    role = (data.get('role') or 'EMPRESA').strip().upper()
    nome = (data.get('nome') or '').strip()
    cnpj = (data.get('cnpj') or '').strip()

    if not username or not password:
        return Response(
            {'erro': 'Nome de usuário e senha são obrigatórios.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not nome:
        return Response(
            {'erro': 'Nome da empresa/fundo é obrigatório.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not cnpj:
        return Response(
            {'erro': 'CNPJ é obrigatório.'},
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
    user = User.objects.create_user(username=username, password=password, first_name=nome[:30])
    perfil = PerfilUsuario.objects.create(usuario=user, role=role)

    # Cadastra na respectiva tabela (Cedente ou Fundo)
    if role == PerfilUsuario.Role.EMPRESA:
        Cedente.objects.create(
            usuario=user,
            nome=nome,
            codigo=cnpj,
        )
    elif role == PerfilUsuario.Role.GESTOR:
        Fundo.objects.create(
            usuario=user,
            nome=nome,
            codigo=cnpj,
        )

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
            'nome': nome,
            'cnpj': cnpj,
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

    nome = ""
    cnpj = ""
    if perfil.role == PerfilUsuario.Role.EMPRESA:
        cedente = Cedente.objects.filter(usuario=user).first()
        if cedente:
            nome = cedente.nome
            cnpj = cedente.codigo
    elif perfil.role == PerfilUsuario.Role.GESTOR:
        fundo = Fundo.objects.filter(usuario=user).first()
        if fundo:
            nome = fundo.nome
            cnpj = fundo.codigo

    refresh = RefreshToken.for_user(user)
    refresh['role'] = perfil.role
    refresh['username'] = user.username

    return Response(
        {
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'role': perfil.role,
            'nome': nome or user.first_name or user.username,
            'cnpj': cnpj,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Retorna os dados do usuário autenticado via token JWT, incluindo nome e CNPJ das tabelas de Cedente/Fundo.
    """
    user = request.user
    perfil, _ = PerfilUsuario.objects.get_or_create(usuario=user, defaults={'role': PerfilUsuario.Role.EMPRESA})

    nome = ""
    cnpj = ""
    if perfil.role == PerfilUsuario.Role.EMPRESA:
        cedente = Cedente.objects.filter(usuario=user).first()
        if cedente:
            nome = cedente.nome
            cnpj = cedente.codigo
    elif perfil.role == PerfilUsuario.Role.GESTOR:
        fundo = Fundo.objects.filter(usuario=user).first()
        if fundo:
            nome = fundo.nome
            cnpj = fundo.codigo

    return Response({
        'username': user.username,
        'role': perfil.role,
        'nome': nome or user.first_name or user.username,
        'cnpj': cnpj,
    })
