from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeDocumentViewSet, UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('employee-documents', EmployeeDocumentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
