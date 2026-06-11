from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet, FieldReportViewSet, ServiceRatingViewSet

router = DefaultRouter()
router.register('complaints', ComplaintViewSet)
router.register('field-reports', FieldReportViewSet)
router.register('ratings', ServiceRatingViewSet)

ratings_alias = ServiceRatingViewSet.as_view({'get': 'list', 'post': 'create'})

urlpatterns = [
    path('complaints/ratings/', ratings_alias, name='complaints-ratings-alias'),
    path('', include(router.urls)),
]
