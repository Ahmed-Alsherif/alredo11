from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ZoneViewSet, RouteViewSet

router = DefaultRouter()
router.register('zones', ZoneViewSet)
router.register('routes', RouteViewSet, basename='route')

urlpatterns = [
    path('', include(router.urls)),
]
