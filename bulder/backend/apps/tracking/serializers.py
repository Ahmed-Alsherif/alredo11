from rest_framework import serializers

from .models import CollectionVisit, TruckLocation


class TruckLocationSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.display_name', read_only=True)
    zone_name = serializers.CharField(source='driver.profile_zone_name', read_only=True, default='')

    class Meta:
        model = TruckLocation
        fields = '__all__'


class CollectionVisitSerializer(serializers.ModelSerializer):
    subscriber_name = serializers.CharField(source='subscriber.name', read_only=True)
    subscriber_phone = serializers.CharField(source='subscriber.phone', read_only=True)
    zone_name = serializers.CharField(source='subscriber.zone.name', read_only=True, default='')
    driver_name = serializers.CharField(source='driver.display_name', read_only=True)

    class Meta:
        model = CollectionVisit
        fields = '__all__'
        read_only_fields = ['driver', 'route', 'subscriber', 'visit_date', 'created_at', 'completed_at']
