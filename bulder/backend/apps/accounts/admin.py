from django.contrib import admin
from .models import User, EmployeeProfile, DriverProfile, AgentProfile, AccountantProfile, EmployeeDocument


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'role', 'email']
    list_filter = ['role']
    search_fields = ['username', 'email']


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'phone', 'is_active', 'get_role']
    list_filter = ['is_active']
    search_fields = ['first_name', 'last_name', 'phone']

    @admin.display(description='Role')
    def get_role(self, obj):
        return obj.user.get_role_display()


@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ['get_name', 'zone', 'license_number', 'truck_number']
    list_filter = ['zone']
    search_fields = ['employee__first_name', 'employee__last_name']

    @admin.display(description='Name')
    def get_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"


@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ['get_name', 'zone', 'custody_amount']
    list_filter = ['zone']
    search_fields = ['employee__first_name', 'employee__last_name']

    @admin.display(description='Name')
    def get_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"


@admin.register(AccountantProfile)
class AccountantProfileAdmin(admin.ModelAdmin):
    list_display = ['get_name']
    search_fields = ['employee__first_name', 'employee__last_name']

    @admin.display(description='Name')
    def get_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ['employee', 'document_type', 'title', 'expires_at']
    list_filter = ['document_type']
    search_fields = ['employee__first_name', 'employee__last_name', 'title']
