from django.contrib import admin
from .models import TruckLocation, CollectionVisit


@admin.register(TruckLocation)
class TruckLocationAdmin(admin.ModelAdmin):
    list_display = ['id', 'driver', 'latitude', 'longitude', 'timestamp']
    list_filter = ['timestamp']
    search_fields = ['driver__username']
    raw_id_fields = ['driver']


@admin.register(CollectionVisit)
class CollectionVisitAdmin(admin.ModelAdmin):
    list_display = ['id', 'route', 'driver', 'subscriber', 'visit_date', 'status', 'completed_at']
    list_filter = ['status', 'visit_date']
    search_fields = ['driver__username', 'subscriber__first_name', 'subscriber__last_name']
    raw_id_fields = ['route', 'driver', 'subscriber']
