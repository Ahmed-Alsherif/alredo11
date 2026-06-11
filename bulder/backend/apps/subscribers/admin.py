from django.contrib import admin
from .models import SubscriptionPlan, Subscriber, SubscriptionLog


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'duration_months', 'price']
    search_fields = ['name']


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ['id', 'subscription_id', 'first_name', 'last_name', 'phone', 'zone', 'plan', 'color_status', 'is_paused', 'created_at']
    list_filter = ['color_status', 'is_paused', 'zone', 'plan']
    search_fields = ['first_name', 'last_name', 'phone', 'subscription_id', 'address']
    raw_id_fields = ['user']


@admin.register(SubscriptionLog)
class SubscriptionLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'subscriber', 'plan', 'payment', 'start_date', 'end_date', 'created_at']
    list_filter = ['plan', 'start_date', 'end_date']
    search_fields = ['subscriber__first_name', 'subscriber__last_name', 'subscriber__subscription_id']
    raw_id_fields = ['subscriber', 'payment']
