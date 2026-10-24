"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    """Endpoint raiz e healthcheck da API."""
    return JsonResponse({
        'status': 'online',
        'app': 'Antecipe FIDC API (Hackathon Kanastra 2026)',
        'version': '1.0.0',
        'endpoints': {
            'auth_login': '/api/auth/login/',
            'auth_register': '/api/auth/register/',
            'recebiveis': '/api/recebiveis/',
            'regras': '/api/regras/',
            'upload_csv': '/api/upload-csv/',
            'analytics_dashboard': '/api/analytics/dashboard/',
        },
    })


urlpatterns = [
    # Healthcheck e status
    path('', health_check, name='root-health'),
    path('health/', health_check, name='health-check'),

    # Admin Django
    path('admin/', admin.site.urls),

    # API Principal
    path('api/', include('core.urls')),

    # Fallback tolerante para clientes que realizarem requisições sem o prefixo /api/
    path('', include('core.urls')),
]
