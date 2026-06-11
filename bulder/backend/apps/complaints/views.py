from rest_framework import status, viewsets
from rest_framework.response import Response
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.permissions import IsStaff

from .models import Complaint, FieldReport, ServiceRating
from .serializers import ComplaintSerializer, FieldReportSerializer, ServiceRatingSerializer


class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.select_related('subscriber__user', 'subscriber__zone').all()
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.SUBSCRIBER:
            qs = qs.filter(subscriber__user=user)
        elif user.role in (User.Role.AGENT, User.Role.DRIVER) and user.profile_zone:
            qs = qs.filter(subscriber__zone=user.profile_zone)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        if self.request.user.role == User.Role.SUBSCRIBER:
            serializer.save(subscriber=self.request.user.subscriber_profile)
        else:
            serializer.save()

    def partial_update(self, request, *args, **kwargs):
        if request.user.role == User.Role.SUBSCRIBER:
            return Response({'error': 'Subscribers cannot change complaint status'}, status=status.HTTP_403_FORBIDDEN)
        response = super().partial_update(request, *args, **kwargs)
        complaint = self.get_object()
        if complaint.status == Complaint.Status.RESOLVED and not complaint.resolved_at:
            complaint.resolved_at = timezone.now()
            complaint.save(update_fields=['resolved_at'])
        return response


class FieldReportViewSet(viewsets.ModelViewSet):
    queryset = FieldReport.objects.select_related('driver', 'subscriber__user', 'subscriber__zone').all()
    serializer_class = FieldReportSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.DRIVER:
            return qs.filter(driver=user)
        if user.role == User.Role.AGENT and user.profile_zone:
            return qs.filter(subscriber__zone=user.profile_zone)
        if user.role == User.Role.SUBSCRIBER:
            return qs.filter(subscriber__user=user)
        return qs

    def perform_create(self, serializer):
        report = serializer.save(driver=self.request.user if self.request.user.role == User.Role.DRIVER else serializer.validated_data.get('driver'))
        try:
            from apps.notifications.services import notify_field_report

            notify_field_report(report)
        except Exception:
            pass


class ServiceRatingViewSet(viewsets.ModelViewSet):
    queryset = ServiceRating.objects.select_related('subscriber__user').all()
    serializer_class = ServiceRatingSerializer

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsStaff()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.SUBSCRIBER:
            return qs.filter(subscriber__user=user)
        return qs

    def perform_create(self, serializer):
        if self.request.user.role == User.Role.SUBSCRIBER:
            serializer.save(subscriber=self.request.user.subscriber_profile)
        else:
            serializer.save()
