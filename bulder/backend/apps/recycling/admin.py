from django.contrib import admin
from .models import RecycleRequest, PointsTransaction, Reward


@admin.register(RecycleRequest)
class RecycleRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'subscriber', 'category', 'bags_count', 'status', 'confirmed_by', 'created_at']
    list_filter = ['category', 'status', 'created_at']
    search_fields = ['subscriber__first_name', 'subscriber__last_name']
    raw_id_fields = ['subscriber', 'confirmed_by']


@admin.register(PointsTransaction)
class PointsTransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'subscriber', 'points', 'reason', 'created_at']
    list_filter = ['created_at']
    search_fields = ['subscriber__first_name', 'subscriber__last_name', 'reason']
    raw_id_fields = ['subscriber', 'recycle_request']


@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ['id', 'subscriber', 'title', 'month', 'created_at']
    list_filter = ['month', 'created_at']
    search_fields = ['subscriber__first_name', 'subscriber__last_name', 'title']
    raw_id_fields = ['subscriber']
