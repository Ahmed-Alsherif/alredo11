from rest_framework import serializers

from .models import Subscriber, SubscriptionLog, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'


class SubscriptionLogSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True, default='')
    plan_price = serializers.DecimalField(source='plan.price', max_digits=8, decimal_places=2, read_only=True, default=0)
    subscriber_name = serializers.CharField(source='subscriber.name', read_only=True)
    payment_receipt = serializers.CharField(source='payment.receipt_number', read_only=True, default='')

    class Meta:
        model = SubscriptionLog
        fields = '__all__'


class SubscriberSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    zone_name = serializers.CharField(source='zone.name', read_only=True, default=None)
    plan_name = serializers.CharField(source='plan.name', read_only=True, default=None)
    color_status_display = serializers.CharField(source='get_color_status_display', read_only=True)
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Subscriber
        fields = [
            'id', 'user', 'subscription_id', 'first_name', 'last_name', 'name',
            'phone', 'username', 'zone', 'zone_name', 'plan', 'plan_name',
            'color_status', 'color_status_display', 'latitude', 'longitude',
            'address', 'subscription_start', 'subscription_end', 'is_paused',
            'paused_at', 'excuse', 'archived_at',
            'archive_reason', 'balance', 'created_at',
        ]
        read_only_fields = ['subscription_id', 'created_at', 'archived_at']

    def get_name(self, obj):
        return obj.name

    def get_balance(self, obj):
        if not obj.plan:
            return 0
        has_current_payment = obj.subscription_end is not None
        return 0 if has_current_payment and obj.color_status == Subscriber.ColorStatus.GREEN else float(obj.plan.price)


class FieldSubscriberCreateSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True, min_length=4)
    first_name = serializers.CharField()
    last_name = serializers.CharField(required=False, allow_blank=True, default='')
    phone = serializers.CharField()
    address = serializers.CharField(required=False, allow_blank=True, default='')
    plan = serializers.IntegerField(required=False, allow_null=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    zone = serializers.IntegerField(required=False, allow_null=True)
