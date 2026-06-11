from django.contrib import admin
from .models import Complaint, FieldReport, ServiceRating


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['id', 'subscriber', 'type', 'status', 'created_at', 'resolved_at']
    list_filter = ['type', 'status', 'created_at']
    search_fields = ['subscriber__first_name', 'subscriber__last_name', 'description']
    raw_id_fields = ['subscriber']


@admin.register(FieldReport)
class FieldReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'driver', 'subscriber', 'issue_type', 'created_at']
    list_filter = ['issue_type', 'created_at']
    search_fields = ['driver__username', 'subscriber__first_name', 'subscriber__last_name', 'note']
    raw_id_fields = ['driver', 'subscriber']


@admin.register(ServiceRating)
class ServiceRatingAdmin(admin.ModelAdmin):
    list_display = ['id', 'subscriber', 'month', 'rating', 'created_at']
    list_filter = ['rating', 'month']
    search_fields = ['subscriber__first_name', 'subscriber__last_name', 'comment']
    raw_id_fields = ['subscriber']
