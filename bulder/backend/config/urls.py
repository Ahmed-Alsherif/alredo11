"""Sall API — Main URL Configuration"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def health_home(request):
    return JsonResponse({
        'name': 'Salla waste management API',
        'status': 'running',
        'message': 'Backend is running. Use /api/ endpoints or open the dashboard.',
        'links': {
            'admin': '/admin/',
            'api_login': '/api/auth/login/',
            'dashboard': 'http://127.0.0.1:5173/',
        },
    })

urlpatterns = [
    # Friendly backend root
    path('', health_home, name='health-home'),

    # Admin
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # DRF browsable API login
    path('api-auth/', include('rest_framework.urls')),

    # App APIs
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.zones.urls')),
    path('api/', include('apps.subscribers.urls')),
    path('api/', include('apps.tracking.urls')),
    path('api/', include('apps.notifications.urls')),
    path('api/', include('apps.complaints.urls')),
    path('api/', include('apps.recycling.urls')),
    path('api/', include('apps.finance.urls')),
    path('api/reports/', include('apps.reports.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
