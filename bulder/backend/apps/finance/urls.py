from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdvanceViewSet, CollectionSettlementViewSet, ExpenseViewSet, PaymentViewSet, PenaltyViewSet, StaffRewardViewSet

router = DefaultRouter()
router.register('payments', PaymentViewSet)
router.register('expenses', ExpenseViewSet)
router.register('advances', AdvanceViewSet)
router.register('penalties', PenaltyViewSet)
router.register('staff-rewards', StaffRewardViewSet)
router.register('settlements', CollectionSettlementViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('finance/', include(router.urls)),
]
