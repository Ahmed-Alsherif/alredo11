from rest_framework import serializers

from .models import Complaint, FieldReport, ServiceRating


class ComplaintSerializer(serializers.ModelSerializer):
    subscriber_name = serializers.CharField(source='subscriber.name', read_only=True)
    zone_name = serializers.CharField(source='subscriber.zone.name', read_only=True, default=None)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Complaint
        fields = '__all__'


class FieldReportSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.display_name', read_only=True)
    subscriber_name = serializers.CharField(source='subscriber.name', read_only=True, default='')

    class Meta:
        model = FieldReport
        fields = '__all__'


class ServiceRatingSerializer(serializers.ModelSerializer):
    subscriber_name = serializers.CharField(source='subscriber.name', read_only=True)

    class Meta:
        model = ServiceRating
        fields = '__all__'

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value
