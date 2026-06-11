from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecycleRequestViewSet, PointsTransactionViewSet, RewardViewSet

router = DefaultRouter()
router.register('recycle-requests', RecycleRequestViewSet)
router.register('points', PointsTransactionViewSet, basename='points')
router.register('rewards', RewardViewSet)

recycling_list = RecycleRequestViewSet.as_view({'get': 'list', 'post': 'create'})
recycling_detail = RecycleRequestViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})
recycling_confirm = RecycleRequestViewSet.as_view({'post': 'confirm'})
recycling_stats = RecycleRequestViewSet.as_view({'get': 'stats'})
recycling_leaderboard = PointsTransactionViewSet.as_view({'get': 'leaderboard'})

urlpatterns = [
    path('', include(router.urls)),
    path('recycling/', recycling_list, name='recycling-list'),
    path('recycling/stats/', recycling_stats, name='recycling-stats'),
    path('recycling/leaderboard/', recycling_leaderboard, name='recycling-leaderboard'),
    path('recycling/<int:pk>/', recycling_detail, name='recycling-detail'),
    path('recycling/<int:pk>/confirm/', recycling_confirm, name='recycling-confirm'),
]
