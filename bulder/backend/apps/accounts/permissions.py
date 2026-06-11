"""صلاحيات مخصصة حسب الدور — FR-05-06"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """المدير العام فقط"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrAccountant(BasePermission):
    """المدير أو المحاسب"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'accountant')


class IsDriver(BasePermission):
    """السائق فقط"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'driver'


class IsAgent(BasePermission):
    """المندوب فقط"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'agent'


class IsSubscriber(BasePermission):
    """المشترك فقط"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'subscriber'


class IsFieldStaff(BasePermission):
    """السائق أو المندوب"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('driver', 'agent')


class IsStaff(BasePermission):
    """أي موظف (ليس مشترك)"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role != 'subscriber'
