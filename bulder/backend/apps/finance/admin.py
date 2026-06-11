from django.contrib import admin
from .models import Payment, Expense, Advance, Penalty, StaffReward, CollectionSettlement

@admin.register(CollectionSettlement)
class CollectionSettlementAdmin(admin.ModelAdmin):
    list_display = ['id', 'agent', 'total_amount', 'date', 'status', 'accountant']
    list_filter = ['status', 'date']
    search_fields = ['agent__user__username', 'accountant__user__username']
    raw_id_fields = ['agent', 'accountant']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'receipt_number', 'subscriber', 'plan', 'agent', 'settlement', 'amount', 'date', 'status', 'created_at']
    list_filter = ['status', 'date', 'plan']
    search_fields = ['receipt_number', 'subscriber__first_name', 'subscriber__last_name', 'subscriber__subscription_id']
    raw_id_fields = ['subscriber', 'agent', 'plan', 'settlement']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['id', 'description', 'amount', 'category', 'date', 'created_at']
    list_filter = ['category', 'date']
    search_fields = ['description']


@admin.register(Advance)
class AdvanceAdmin(admin.ModelAdmin):
    list_display = ['id', 'employee', 'amount', 'status', 'date']
    list_filter = ['status', 'date']
    search_fields = ['employee__username', 'note']
    raw_id_fields = ['employee']


@admin.register(Penalty)
class PenaltyAdmin(admin.ModelAdmin):
    list_display = ['id', 'employee', 'amount', 'date', 'reason']
    list_filter = ['date']
    search_fields = ['employee__username', 'reason']
    raw_id_fields = ['employee']


@admin.register(StaffReward)
class StaffRewardAdmin(admin.ModelAdmin):
    list_display = ['id', 'employee', 'amount', 'date', 'reason']
    list_filter = ['date']
    search_fields = ['employee__username', 'reason']
    raw_id_fields = ['employee']
