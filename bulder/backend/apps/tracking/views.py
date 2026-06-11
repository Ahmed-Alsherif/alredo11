from django.db.models import Max
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsStaff

from .models import CollectionVisit, TruckLocation
from .serializers import CollectionVisitSerializer, TruckLocationSerializer


class TruckLocationViewSet(viewsets.ModelViewSet):
    queryset = TruckLocation.objects.select_related('driver').all()
    serializer_class = TruckLocationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.DRIVER:
            return qs.filter(driver=user)
        if user.role == User.Role.SUBSCRIBER and user.profile_zone:
            return qs.filter(driver__driver_profile__zone=user.profile_zone)
        return qs

    def get_permissions(self):
        if self.action in ('create', 'update_location'):
            return super().get_permissions()
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def live(self, request):
        qs = self.get_queryset()
        latest_ids = qs.values('driver').annotate(latest=Max('id')).values_list('latest', flat=True)
        locations = TruckLocation.objects.filter(id__in=latest_ids).select_related('driver')
        return Response(self.get_serializer(locations, many=True).data)

    @action(detail=False, methods=['post'])
    def update_location(self, request):
        if request.user.role != User.Role.DRIVER:
            return Response({'error': 'Only drivers can update truck location'}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(data={
            'driver': request.user.id,
            'latitude': request.data.get('latitude'),
            'longitude': request.data.get('longitude'),
        })
        serializer.is_valid(raise_exception=True)
        serializer.save()
        try:
            from apps.notifications.services import notify_truck_proximity

            notify_truck_proximity(request.user, float(request.data.get('latitude')), float(request.data.get('longitude')))
        except Exception:
            pass
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CollectionVisitViewSet(viewsets.ModelViewSet):
    queryset = CollectionVisit.objects.select_related('route', 'driver', 'subscriber__zone').all()
    serializer_class = CollectionVisitSerializer

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

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'mark_status'):
            return super().get_permissions()
        return [IsStaff()]

    @action(detail=True, methods=['post'])
    def mark_status(self, request, pk=None):
        visit = self.get_object()
        if request.user.role != User.Role.DRIVER or visit.driver_id != request.user.id:
            return Response({'error': 'Only the assigned driver can update this visit'}, status=status.HTTP_403_FORBIDDEN)
        status_value = request.data.get('status')
        if status_value not in CollectionVisit.Status.values:
            return Response({'error': 'Invalid visit status'}, status=status.HTTP_400_BAD_REQUEST)
        visit.status = status_value
        visit.note = request.data.get('note', visit.note)
        if status_value in (CollectionVisit.Status.COLLECTED, CollectionVisit.Status.SKIPPED, CollectionVisit.Status.ISSUE):
            visit.completed_at = timezone.now()
        visit.save(update_fields=['status', 'note', 'completed_at'])
        return Response(self.get_serializer(visit).data)
