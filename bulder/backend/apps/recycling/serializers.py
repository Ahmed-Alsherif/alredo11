from rest_framework import serializers

from .models import PointsTransaction, RecycleRequest, Reward


class RecycleRequestSerializer(serializers.ModelSerializer):
    subscriber_name = serializers.CharField(source='subscriber.name', read_only=True)
    zone_name = serializers.CharField(source='subscriber.zone.name', read_only=True, default='')
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = RecycleRequest
        fields = '__all__'
        read_only_fields = ['subscriber', 'confirmed_by', 'status']


class PointsTransactionSerializer(serializers.ModelSerializer):
    subscriber_name = serializers.CharField(source='subscriber.name', read_only=True)

    class Meta:
        model = PointsTransaction
        fields = '__all__'


class RewardSerializer(serializers.ModelSerializer):
    subscriber_name = serializers.CharField(source='subscriber.name', read_only=True)

    class Meta:
        model = Reward
        fields = '__all__'
