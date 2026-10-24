"""
URLs do app Core do Antecipe.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from core.auth_views import login_view, me_view, register_view
from core.views import (
    LoteImportacaoViewSet,
    RecebivelViewSet,
    regras_vigentes_view,
    upload_csv_view,
)

router = DefaultRouter()
router.register(r'recebiveis', RecebivelViewSet, basename='recebivel')
router.register(r'lotes', LoteImportacaoViewSet, basename='lote')

urlpatterns = [
    # Autenticação JWT e RBAC
    path('auth/register/', register_view, name='auth-register'),
    path('auth/login/', login_view, name='auth-login'),
    path('auth/me/', me_view, name='auth-me'),

    # Operações de Negócio
    path('upload-csv/', upload_csv_view, name='upload-csv'),
    path('regras/', regras_vigentes_view, name='regras-vigentes'),
    path('', include(router.urls)),
]
