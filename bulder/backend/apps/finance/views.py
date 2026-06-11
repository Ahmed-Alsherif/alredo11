from datetime import timedelta

from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminOrAccountant, IsStaff
from apps.notifications.models import Notification
from apps.subscribers.models import Subscriber

from .models import Advance, CollectionSettlement, Expense, Payment, Penalty, StaffReward
from .serializers import (
    AdvanceSerializer,
    CollectionSettlementSerializer,
    ExpenseSerializer,
    PaymentSerializer,
    PenaltySerializer,
    StaffRewardSerializer,
)


def find_subscriber(reference):
    if not reference:
        return None
    query = (
        Q(subscription_id__iexact=reference)
        | Q(phone=reference)
        | Q(user__username__iexact=reference)
    )
    if str(reference).isdigit():
        query |= Q(id=int(reference))
    return Subscriber.objects.filter(query).first()


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('subscriber__user', 'subscriber__zone', 'agent').all()
    serializer_class = PaymentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.SUBSCRIBER:
            return qs.filter(subscriber__user=user)
        if user.role == User.Role.AGENT:
            return qs.filter(agent=user.profile)
        return qs

    def get_permissions(self):
        if self.action in ('reconcile', 'mark_deposited'):
            return [IsAdminOrAccountant()]
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        if self.action == 'create':
            return [IsStaff()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        if request.user.role not in (User.Role.ADMIN, User.Role.ACCOUNTANT, User.Role.AGENT):
            return Response({'error': 'Only admins, accountants, and agents can create payments'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        sub_ref = data.get('subscriber_ref') or data.get('subscriber_name') or data.get('subscriber')
        sub = find_subscriber(str(sub_ref).strip())
        if not sub:
            return Response({'error': 'Subscriber was not found by subscription id, phone, or username'}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role == User.Role.AGENT and request.user.profile_zone and sub.zone_id != request.user.profile_zone.id:
            return Response({'error': 'Subscriber is outside agent zone'}, status=status.HTTP_403_FORBIDDEN)

        data['subscriber'] = sub.id
        if request.user.role == User.Role.AGENT:
            data['agent'] = request.user.profile.id
        data.pop('subscriber_ref', None)
        data.pop('subscriber_name', None)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(status=Payment.Status.PENDING_DEPOSIT)
        self._apply_subscription_extension(payment)
        Notification.objects.create(
            recipient=payment.subscriber.user,
            type='payment',
            title='Payment receipt',
            body=f'Received {payment.amount}. Receipt: {payment.receipt_number}.',
        )
        return Response(self.get_serializer(payment).data, status=status.HTTP_201_CREATED)

    def _apply_subscription_extension(self, payment):
        sub = payment.subscriber
        if not sub.plan:
            return
        start_date = sub.subscription_end if sub.subscription_end and sub.subscription_end >= timezone.now().date() else timezone.now().date()
        sub.subscription_end = start_date + timedelta(days=sub.plan.duration_months * 30)
        sub.save(update_fields=['subscription_end'])
        sub.update_color_status()

    @action(detail=False, methods=['get'])
    def reconcile(self, request):
        data = []
        for agent in User.objects.filter(role=User.Role.AGENT):
            payments = Payment.objects.filter(agent=agent)
            data.append({
                'agent_id': agent.id,
                'agent_name': agent.display_name,
                'pending_count': payments.filter(status=Payment.Status.PENDING_DEPOSIT).count(),
                'pending_total': float(payments.filter(status=Payment.Status.PENDING_DEPOSIT).aggregate(t=Sum('amount'))['t'] or 0),
                'deposited_count': payments.filter(status=Payment.Status.DEPOSITED).count(),
                'deposited_total': float(payments.filter(status=Payment.Status.DEPOSITED).aggregate(t=Sum('amount'))['t'] or 0),
            })
        return Response(data)

    @action(detail=True, methods=['post'])
    def mark_deposited(self, request, pk=None):
        payment = self.get_object()
        payment.status = Payment.Status.DEPOSITED
        payment.save(update_fields=['status'])
        return Response({'status': 'deposited'})


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrAccountant()]
        return [IsStaff()]


class AdvanceViewSet(viewsets.ModelViewSet):
    queryset = Advance.objects.select_related('employee').all()
    serializer_class = AdvanceSerializer

    def get_permissions(self):
        return [IsAdminOrAccountant()]

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        advance = self.get_object()
        advance.status = Advance.Status.PAID
        advance.save(update_fields=['status'])
        return Response({'status': 'paid'})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        active = Advance.objects.filter(status=Advance.Status.ACTIVE)
        paid = Advance.objects.filter(status=Advance.Status.PAID)
        return Response({
            'active_count': active.count(),
            'active_total': float(active.aggregate(t=Sum('amount'))['t'] or 0),
            'paid_count': paid.count(),
            'paid_total': float(paid.aggregate(t=Sum('amount'))['t'] or 0),
        })


class PenaltyViewSet(viewsets.ModelViewSet):
    queryset = Penalty.objects.select_related('employee').all()
    serializer_class = PenaltySerializer

    def get_permissions(self):
        return [IsAdminOrAccountant()]


class StaffRewardViewSet(viewsets.ModelViewSet):
    queryset = StaffReward.objects.select_related('employee').all()
    serializer_class = StaffRewardSerializer

    def get_permissions(self):
        return [IsAdminOrAccountant()]


class CollectionSettlementViewSet(viewsets.ModelViewSet):
    queryset = CollectionSettlement.objects.select_related('agent', 'accountant').all()
    serializer_class = CollectionSettlementSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == User.Role.AGENT:
            return qs.filter(agent=self.request.user.profile)
        return qs

    def get_permissions(self):
        if self.action in ('approve', 'reject'):
            return [IsAdminOrAccountant()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role != User.Role.AGENT:
            return Response({'error': 'Only agents can create settlements'}, status=status.HTTP_403_FORBIDDEN)
        
        agent_profile = user.profile
        payments = Payment.objects.filter(agent=agent_profile, settlement__isnull=True, status=Payment.Status.PENDING_DEPOSIT)
        
        if not payments.exists():
            return Response({'error': 'No pending payments to settle'}, status=status.HTTP_400_BAD_REQUEST)
        
        total_amount = sum(p.amount for p in payments)
        
        settlement = CollectionSettlement.objects.create(
            agent=agent_profile,
            total_amount=total_amount,
            status=CollectionSettlement.Status.PENDING
        )
        
        payments.update(settlement=settlement)
        
        return Response(self.get_serializer(settlement).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        settlement = self.get_object()
        if settlement.status != CollectionSettlement.Status.PENDING:
            return Response({'error': 'Settlement is not pending'}, status=status.HTTP_400_BAD_REQUEST)
        
        settlement.status = CollectionSettlement.Status.APPROVED
        if hasattr(request.user, 'accountant_profile'):
            settlement.accountant = request.user.accountant_profile
        settlement.save()
        
        settlement.payments.all().update(status=Payment.Status.CONFIRMED)
        
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        settlement = self.get_object()
        if settlement.status != CollectionSettlement.Status.PENDING:
            return Response({'error': 'Settlement is not pending'}, status=status.HTTP_400_BAD_REQUEST)
        
        settlement.status = CollectionSettlement.Status.REJECTED
        settlement.note = request.data.get('note', '')
        if hasattr(request.user, 'accountant_profile'):
            settlement.accountant = request.user.accountant_profile
        settlement.save()
        
        # Free the payments so they can be settled again
        settlement.payments.all().update(settlement=None)
        
        return Response({'status': 'rejected'})
