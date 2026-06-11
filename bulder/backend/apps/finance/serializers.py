from rest_framework import serializers

from .models import Advance, CollectionSettlement, Expense, Payment, Penalty, StaffReward


class CollectionSettlementSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.display_name', read_only=True)
    accountant_name = serializers.CharField(source='accountant.display_name', read_only=True, default='')

    class Meta:
        model = CollectionSettlement
        fields = '__all__'
        read_only_fields = ['date', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    subscriber_name = serializers.CharField(source='subscriber.name', read_only=True)
    subscriber_ref = serializers.CharField(write_only=True, required=False, allow_blank=True)
    agent_name = serializers.CharField(source='agent.display_name', read_only=True, default='')
    settlement_status = serializers.CharField(source='settlement.status', read_only=True, default='')

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['receipt_number', 'date', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'


class AdvanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.display_name', read_only=True)

    class Meta:
        model = Advance
        fields = '__all__'


class PenaltySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.display_name', read_only=True)

    class Meta:
        model = Penalty
        fields = '__all__'


class StaffRewardSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.display_name', read_only=True)

    class Meta:
        model = StaffReward
        fields = '__all__'
