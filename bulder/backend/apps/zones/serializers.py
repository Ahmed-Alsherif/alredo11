from rest_framework import serializers

from .models import Route, Zone


class ZoneSerializer(serializers.ModelSerializer):
    subscribers_count = serializers.IntegerField(read_only=True)
    drivers_count = serializers.IntegerField(read_only=True)
    agents_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Zone
        fields = '__all__'


class RouteSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = '__all__'

    def get_driver_name(self, obj):
        return obj.driver.display_name if obj.driver else 'غير محدد'
