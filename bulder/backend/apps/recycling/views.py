import random
from datetime import date, timedelta

from django.db.models import Sum
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin, IsStaff
from apps.finance.models import Expense
from apps.notifications.models import Notification
from apps.subscribers.models import Subscriber

from .models import PointsTransaction, RecycleRequest, Reward
from .serializers import PointsTransactionSerializer, RecycleRequestSerializer, RewardSerializer


POINTS_MAP = {
    'plastic': 30,
    'metal': 40,
    'paper': 20,
    'bread': 15,
}


def eco_rank(points):
    if points >= 1000:
        return 'حامي البيئة'
    if points >= 500:
        return 'صديق البيئة'
    return 'مساهم'


class RecycleRequestViewSet(viewsets.ModelViewSet):
    queryset = RecycleRequest.objects.select_related('subscriber__user', 'subscriber__zone', 'confirmed_by').all()
    serializer_class = RecycleRequestSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.SUBSCRIBER:
            return qs.filter(subscriber__user=user)
        if user.role in (User.Role.DRIVER, User.Role.AGENT) and user.profile_zone:
            return qs.filter(subscriber__zone=user.profile_zone)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != User.Role.SUBSCRIBER:
            raise PermissionDenied('Only subscribers can create recycle requests')
        serializer.save(subscriber=user.subscriber_profile)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        if request.user.role != User.Role.DRIVER:
            return Response({'error': 'Only drivers can confirm recycle pickup'}, status=status.HTTP_403_FORBIDDEN)
        req = self.get_object()
        if req.status == RecycleRequest.Status.COLLECTED:
            points = getattr(req, 'points_transaction', None)
            return Response({'status': 'already confirmed', 'points_added': points.points if points else 0})
        if request.user.profile_zone and req.subscriber.zone_id != request.user.profile_zone.id:
            return Response({'error': 'Recycle request is outside driver zone'}, status=status.HTTP_403_FORBIDDEN)

        req.status = RecycleRequest.Status.COLLECTED
        req.confirmed_by = request.user
        req.save(update_fields=['status', 'confirmed_by'])
        points = req.bags_count * POINTS_MAP.get(req.category, 25)
        PointsTransaction.objects.create(
            subscriber=req.subscriber,
            recycle_request=req,
            points=points,
            reason=f'Collected {req.bags_count} bags of {req.category}',
        )
        Notification.objects.create(
            recipient=req.subscriber.user,
            type='recycle',
            title=f'{points} recycling points added',
            body=f'Your sorted bags were collected and {points} points were added.',
        )
        return Response({'status': 'confirmed', 'points_added': points})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        sub = user.subscriber_profile if user.role == User.Role.SUBSCRIBER and hasattr(user, 'subscriber_profile') else None
        qs = PointsTransaction.objects.filter(subscriber=sub) if sub else PointsTransaction.objects.all()
        reqs = RecycleRequest.objects.filter(status=RecycleRequest.Status.COLLECTED)
        if sub:
            reqs = reqs.filter(subscriber=sub)
        total_points = qs.aggregate(t=Sum('points'))['t'] or 0
        total_ops = reqs.count()
        total_bags = reqs.aggregate(t=Sum('bags_count'))['t'] or 0
        active_participants = reqs.values('subscriber').distinct().count()
        return Response({
            'total_operations': total_ops,
            'total_points': total_points,
            'total_bags': total_bags,
            'active_participants': active_participants,
            'rank': eco_rank(total_points),
        })


class PointsTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PointsTransactionSerializer

    def get_queryset(self):
        qs = PointsTransaction.objects.select_related('subscriber__zone', 'subscriber__user').all()
        user = self.request.user
        if user.role == User.Role.SUBSCRIBER:
            return qs.filter(subscriber__user=user)
        if user.role in (User.Role.AGENT, User.Role.DRIVER) and user.profile_zone:
            return qs.filter(subscriber__zone=user.profile_zone)
        return qs

    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        top = Subscriber.objects.annotate(total_points=Sum('points_transactions__points')).filter(total_points__gt=0)
        if request.user.role in (User.Role.AGENT, User.Role.DRIVER) and request.user.profile_zone:
            top = top.filter(zone=request.user.profile_zone)
        top = top.order_by('-total_points')[:10]
        return Response([
            {
                'rank': i,
                'name': sub.name,
                'zone': sub.zone.name if sub.zone else '',
                'points': sub.total_points or 0,
                'badge': eco_rank(sub.total_points or 0),
            }
            for i, sub in enumerate(top, 1)
        ])


class RewardViewSet(viewsets.ModelViewSet):
    queryset = Reward.objects.select_related('subscriber__user', 'subscriber__plan').all()
    serializer_class = RewardSerializer

    def get_permissions(self):
        if self.action == 'draw':
            return [IsAdmin()]
        return [IsStaff()]

    @action(detail=False, methods=['post'])
    def draw(self, request):
        eligible = Subscriber.objects.filter(recycle_requests__status=RecycleRequest.Status.COLLECTED).distinct()
        if not eligible.exists():
            return Response({'error': 'No eligible subscribers'}, status=status.HTTP_400_BAD_REQUEST)
        winner = random.choice(list(eligible))
        reward = Reward.objects.create(subscriber=winner, title='Monthly recycling reward', month=date.today())
        days = winner.plan.duration_months * 30 if winner.plan else 30
        base_date = winner.subscription_end if winner.subscription_end and winner.subscription_end >= timezone.now().date() else timezone.now().date()
        winner.subscription_end = base_date + timedelta(days=days)
        winner.save(update_fields=['subscription_end'])
        winner.update_color_status()
        plan_price = winner.plan.price if winner.plan else 150
        Expense.objects.create(description=f'Recycling reward - {winner.name}', amount=plan_price, category=Expense.Category.MARKETING)
        Notification.objects.create(
            recipient=winner.user,
            type='recycle',
            title='You won the monthly recycling reward',
            body='Your subscription has been extended as an environmental reward.',
        )
        return Response({'winner': winner.name, 'reward': reward.title, 'cost_recorded': float(plan_price)})
