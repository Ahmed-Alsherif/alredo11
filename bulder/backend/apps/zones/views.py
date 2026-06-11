from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Zone, Route
from .serializers import ZoneSerializer, RouteSerializer
from apps.accounts.permissions import IsAdmin, IsStaff
from apps.notifications.models import Notification


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        from rest_framework.permissions import IsAuthenticated
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        """FR-01-03: التحقق من خلو المنطقة من مشتركين قبل الحذف"""
        zone = self.get_object()
        if zone.subscribers.exists():
            return Response(
                {'error': f'لا يمكن حذف المنطقة لأنها تحتوي على {zone.subscribers.count()} مشترك نشط'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def with_stats(self, request):
        """FR-01-04: استعراض المناطق مع إحصائيات"""
        zones = Zone.objects.all()
        data = []
        for z in zones:
            data.append({
                'id': z.id,
                'name': z.name,
                'status': z.status,
                'subscribers_count': z.subscribers_count,
                'drivers_count': z.drivers_count,
                'agents_count': z.agents_count,
                'routes_count': z.routes.count(),
            })
        return Response(data)


class RouteViewSet(viewsets.ModelViewSet):
    serializer_class = RouteSerializer

    def get_queryset(self):
        """FR-01-09: فلتر المسارات حسب نطاق الموظف"""
        qs = Route.objects.select_related('zone', 'driver').all()
        user = self.request.user
        user_zone = user.profile_zone
        if user.role in ('driver', 'agent') and user_zone:
            qs = qs.filter(zone=user_zone)
        return qs

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsStaff()]

    @action(detail=True, methods=['post'])
    def freeze(self, request, pk=None):
        """FR-01-10: تجميد مسار مع إرسال إشعار"""
        route = self.get_object()
        route.status = 'frozen'
        route.save()
        # إرسال إشعار لجميع المشتركين في المنطقة
        subscribers = route.zone.subscribers.select_related('user').all()
        notifications = []
        for sub in subscribers:
            notifications.append(Notification(
                recipient=sub.user,
                type='system',
                title='⏸️ تم تجميد مسار الجمع',
                body=f'تم تجميد مسار الجمع في منطقة {route.zone.name} مؤقتاً. سيتم إعلامكم عند استئنافه.'
            ))
        Notification.objects.bulk_create(notifications)
        return Response({'status': f'تم تجميد المسار وإشعار {len(notifications)} مشترك'})

    @action(detail=True, methods=['post'])
    def unfreeze(self, request, pk=None):
        """إلغاء تجميد المسار"""
        route = self.get_object()
        route.status = 'active'
        route.save()
        return Response({'status': 'تم إلغاء تجميد المسار'})
