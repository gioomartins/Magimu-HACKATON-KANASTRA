"""
URLs do app Core do Antecipe.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

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
    path('upload-csv/', upload_csv_view, name='upload-csv'),
    path('regras/', regras_vigentes_view, name='regras-vigentes'),
    path('', include(router.urls)),
]
