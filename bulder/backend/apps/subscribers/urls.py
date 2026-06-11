from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriberViewSet, SubscriptionLogViewSet, SubscriptionPlanViewSet

router = DefaultRouter()
router.register('subscribers', SubscriberViewSet)
router.register('plans', SubscriptionPlanViewSet)
router.register('logs', SubscriptionLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
