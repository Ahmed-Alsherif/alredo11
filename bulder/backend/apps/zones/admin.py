from django.contrib import admin
from .models import Zone, Route

@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'subscribers_count', 'created_at']
    list_filter = ['status']

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['zone', 'driver', 'collection_days', 'status']
    list_filter = ['status']
