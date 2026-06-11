from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin, IsStaff
from apps.notifications.models import Notification
from apps.tracking.models import CollectionVisit
from apps.zones.models import Route, Zone

from .models import Subscriber, SubscriptionLog, SubscriptionPlan
from .serializers import (
    FieldSubscriberCreateSerializer,
    SubscriberSerializer,
    SubscriptionLogSerializer,
    SubscriptionPlanSerializer,
)


DAYS_MAP = {
    0: 'الإثنين',
    1: 'الثلاثاء',
    2: 'الأربعاء',
    3: 'الخميس',
    4: 'الجمعة',
    5: 'السبت',
    6: 'الأحد',
}


def point_in_polygon(lat, lng, polygon):
    if not polygon or len(polygon) < 3:
        return False
    inside = False
    j = len(polygon) - 1
    for i, point in enumerate(polygon):
        yi = float(point.get('lat', 0))
        xi = float(point.get('lng', 0))
        yj = float(polygon[j].get('lat', 0))
        xj = float(polygon[j].get('lng', 0))
        intersects = ((yi > lat) != (yj > lat)) and (lng < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi)
        if intersects:
            inside = not inside
        j = i
    return inside


def find_zone_by_gps(lat, lng):
    for zone in Zone.objects.filter(status='active'):
        if point_in_polygon(lat, lng, zone.boundaries):
            return zone
    return None


class SubscriberViewSet(viewsets.ModelViewSet):
    queryset = Subscriber.objects.select_related('user', 'zone', 'plan').all()
    serializer_class = SubscriberSerializer

    def get_permissions(self):
        if self.action in ('destroy', 'archive'):
            return [IsAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            if user.role == User.Role.SUBSCRIBER:
                qs = qs.filter(user=user)
            elif user.role in (User.Role.AGENT, User.Role.DRIVER) and user.profile_zone:
                qs = qs.filter(zone=user.profile_zone)

        zone_id = self.request.query_params.get('zone')
        color = self.request.query_params.get('color')
        paused = self.request.query_params.get('paused')
        archived = self.request.query_params.get('archived')
        search = self.request.query_params.get('search')

        if zone_id:
            qs = qs.filter(zone_id=zone_id)
        if color:
            qs = qs.filter(color_status=color)
        if paused is not None:
            qs = qs.filter(is_paused=paused.lower() == 'true')
        if archived is not None:
            qs = qs.filter(archived_at__isnull=archived.lower() != 'true')
        else:
            qs = qs.filter(archived_at__isnull=True)
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone__icontains=search)
                | Q(subscription_id__icontains=search)
                | Q(user__username__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        return self._create_subscriber(request)

    @action(detail=False, methods=['post'])
    def register_with_gps(self, request):
        return self._create_subscriber(request)

    def _create_subscriber(self, request):
        serializer = FieldSubscriberCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        lat = data.get('latitude')
        lng = data.get('longitude')
        zone_id = data.get('zone')

        if lat is not None and lng is not None:
            zone = find_zone_by_gps(lat, lng)
            if not zone:
                return Response({'error': 'Location is outside active coverage zones'}, status=status.HTTP_400_BAD_REQUEST)
            zone_id = zone.id
        elif request.user.role == User.Role.AGENT and request.user.profile_zone:
            zone_id = request.user.profile_zone.id

        username = data.get('username') or data['phone'] or f"sub-{timezone.now().timestamp():.0f}"
        password = data.get('password') or data['phone'][-6:] or '123456'
        email = f"{username}@example.com"
        user = User.objects.create(username=username, email=email, role=User.Role.SUBSCRIBER)
        user.set_password(password)
        user.save()

        sub = Subscriber.objects.create(
            user=user,
            first_name=data['first_name'],
            last_name=data.get('last_name', ''),
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            plan_id=data.get('plan'),
            latitude=lat,
            longitude=lng,
            zone_id=zone_id,
        )
        sub.update_color_status()
        return Response(SubscriberSerializer(sub).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def debtors(self, request):
        qs = self.get_queryset().filter(color_status__in=[Subscriber.ColorStatus.YELLOW, Subscriber.ColorStatus.RED])
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        sub = self.get_object()
        sub.pause(request.data.get('reason', ''))
        Notification.objects.create(
            recipient=sub.user,
            type='system',
            title='Subscription paused',
            body='Your subscription has been paused temporarily.',
        )
        return Response({'status': 'paused'})

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        sub = self.get_object()
        sub.resume()
        Notification.objects.create(
            recipient=sub.user,
            type='system',
            title='Subscription resumed',
            body='Your subscription has been resumed.',
        )
        return Response({'status': 'resumed'})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        sub = self.get_object()
        sub.archive(request.data.get('reason', ''))
        return Response({'status': 'archived'})

    @action(detail=False, methods=['post'])
    def change_plan(self, request):
        if request.user.role != User.Role.SUBSCRIBER:
            return Response({'error': 'Only subscribers can change their plan'}, status=status.HTTP_400_BAD_REQUEST)
        plan_id = request.data.get('plan_id')
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_400_BAD_REQUEST)
        sub = request.user.subscriber_profile
        sub.plan = plan
        sub.save(update_fields=['plan'])
        return Response({'status': 'plan selected', 'plan_name': plan.name, 'price': plan.price})

    @action(detail=True, methods=['post'])
    def set_excuse(self, request, pk=None):
        sub = self.get_object()
        sub.excuse = request.data.get('excuse', '')
        sub.save(update_fields=['excuse'])
        return Response({'status': 'excuse saved'})

    @action(detail=False, methods=['get'])
    def daily_list(self, request):
        if request.user.role != User.Role.DRIVER:
            return Response({'error': 'Only drivers can access daily lists'}, status=status.HTTP_403_FORBIDDEN)
        today = timezone.now().date()
        day_name = DAYS_MAP.get(today.weekday(), '')
        routes = [
            route for route in Route.objects.filter(status='active', driver=request.user)
            if day_name in (route.collection_days or [])
        ]
        visits = []
        for route in routes:
            for sub in Subscriber.objects.filter(zone=route.zone, is_paused=False, archived_at__isnull=True):
                visit, _ = CollectionVisit.objects.get_or_create(
                    route=route,
                    subscriber=sub,
                    driver=request.user,
                    visit_date=today,
                    defaults={'status': CollectionVisit.Status.PENDING},
                )
                visits.append(visit)
        serializer = self.get_serializer([visit.subscriber for visit in visits], many=True)
        return Response({
            'day': day_name,
            'date': str(today),
            'count': len(visits),
            'visits': [
                {'id': visit.id, 'subscriber': visit.subscriber_id, 'status': visit.status}
                for visit in visits
            ],
            'subscribers': serializer.data,
        })


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsStaff()]
        return super().get_permissions()


class SubscriptionLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionLog.objects.select_related('subscriber', 'plan', 'payment').all()
    serializer_class = SubscriptionLogSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.SUBSCRIBER:
            return qs.filter(subscriber__user=user)
        
        subscriber_id = self.request.query_params.get('subscriber')
        if subscriber_id:
            qs = qs.filter(subscriber_id=subscriber_id)
            
        return qs
