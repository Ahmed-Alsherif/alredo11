from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollectionVisitViewSet, TruckLocationViewSet

router = DefaultRouter()
router.register('tracking', TruckLocationViewSet)
router.register('collection-visits', CollectionVisitViewSet)

urlpatterns = [path('', include(router.urls))]
