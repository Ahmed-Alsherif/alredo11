from django.urls import path
from .views import dashboard_stats, financial_report, operational_report, growth_report, export_pdf

urlpatterns = [
    path('dashboard/', dashboard_stats, name='dashboard-stats'),
    path('financial/', financial_report, name='financial-report'),
    path('operational/', operational_report, name='operational-report'),
    path('growth/', growth_report, name='growth-report'),
    path('export/', export_pdf, name='export-pdf'),
]
