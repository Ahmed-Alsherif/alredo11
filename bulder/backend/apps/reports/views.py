import csv
from datetime import timedelta
from io import BytesIO, StringIO

from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.complaints.models import Complaint, FieldReport
from apps.finance.models import Expense, Payment
from apps.subscribers.models import Subscriber
from apps.tracking.models import CollectionVisit
from apps.zones.models import Zone


def can_view_reports(user):
    return user.is_authenticated and user.role in (User.Role.ADMIN, User.Role.ACCOUNTANT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    zones_count = Zone.objects.filter(status='active').count()
    subscribers_count = Subscriber.objects.filter(archived_at__isnull=True).count()
    staff_count = User.objects.exclude(role=User.Role.SUBSCRIBER).count()
    open_complaints = Complaint.objects.exclude(status=Complaint.Status.RESOLVED).count()
    total_revenue = Payment.objects.aggregate(t=Sum('amount'))['t'] or 0
    total_expenses = Expense.objects.aggregate(t=Sum('amount'))['t'] or 0
    color_distribution = dict(
        Subscriber.objects.values('color_status').annotate(c=Count('id')).values_list('color_status', 'c')
    )
    return Response({
        'zones_count': zones_count,
        'subscribers_count': subscribers_count,
        'staff_count': staff_count,
        'open_complaints': open_complaints,
        'total_revenue': float(total_revenue),
        'total_expenses': float(total_expenses),
        'net_profit': float(total_revenue - total_expenses),
        'color_distribution': {
            'green': color_distribution.get('green', 0),
            'yellow': color_distribution.get('yellow', 0),
            'red': color_distribution.get('red', 0),
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def financial_report(request):
    if not can_view_reports(request.user):
        return Response({'error': 'Not allowed'}, status=403)
    monthly = Payment.objects.annotate(month=TruncMonth('date')).values('month').annotate(revenue=Sum('amount')).order_by('month')
    expenses_monthly = Expense.objects.annotate(month=TruncMonth('date')).values('month').annotate(total=Sum('amount')).order_by('month')
    debtors = Subscriber.objects.filter(color_status__in=[Subscriber.ColorStatus.YELLOW, Subscriber.ColorStatus.RED]).count()
    return Response({
        'monthly_revenue': list(monthly),
        'monthly_expenses': list(expenses_monthly),
        'debtors_count': debtors,
        'payments_total': float(Payment.objects.aggregate(t=Sum('amount'))['t'] or 0),
        'expenses_total': float(Expense.objects.aggregate(t=Sum('amount'))['t'] or 0),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def operational_report(request):
    today = timezone.now().date()
    week_ago = today - timedelta(days=6)
    daily_data = []
    for i in range(7):
        day = week_ago + timedelta(days=i)
        visits = CollectionVisit.objects.filter(visit_date=day)
        total = visits.count() or 1
        completed = visits.filter(status=CollectionVisit.Status.COLLECTED).count()
        daily_data.append({
            'date': str(day),
            'day': day.strftime('%a'),
            'completed': int((completed / total) * 100),
            'served_homes': completed,
            'reports': FieldReport.objects.filter(created_at__date=day).count(),
        })

    zone_stats = []
    for zone in Zone.objects.filter(status='active'):
        zone_visits = CollectionVisit.objects.filter(subscriber__zone=zone)
        total = zone_visits.count() or 1
        zone_stats.append({
            'zone': zone.name,
            'subscribers': zone.subscribers.filter(archived_at__isnull=True).count(),
            'complaints': Complaint.objects.filter(subscriber__zone=zone).exclude(status=Complaint.Status.RESOLVED).count(),
            'field_reports': FieldReport.objects.filter(subscriber__zone=zone).count(),
            'completion': int((zone_visits.filter(status=CollectionVisit.Status.COLLECTED).count() / total) * 100),
        })
    return Response({'daily_completion': daily_data, 'zone_stats': zone_stats})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def growth_report(request):
    monthly = Subscriber.objects.annotate(month=TruncMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month')
    cumulative = 0
    data = []
    for row in monthly:
        cumulative += row['count']
        data.append({'month': row['month'].strftime('%Y-%m') if row['month'] else '', 'new': row['count'], 'total': cumulative})
    return Response(data)


def report_rows(report_type):
    if report_type == 'subscribers':
        yield ['subscription_id', 'name', 'zone', 'color_status', 'phone']
        for sub in Subscriber.objects.select_related('zone'):
            yield [sub.subscription_id, sub.name, sub.zone.name if sub.zone else '', sub.color_status, sub.phone]
    elif report_type == 'staff':
        yield ['username', 'name', 'role', 'phone', 'zone']
        for user in User.objects.exclude(role=User.Role.SUBSCRIBER):
            yield [user.username, user.display_name, user.role, user.profile_phone, user.profile_zone_name or '']
    else:
        yield ['date', 'subscriber', 'agent', 'amount', 'status', 'receipt']
        for payment in Payment.objects.select_related('subscriber', 'agent').order_by('-date')[:200]:
            yield [payment.date, payment.subscriber.name, payment.agent.display_name if payment.agent else '', payment.amount, payment.status, payment.receipt_number]


def _pdf_escape(value):
    return str(value).replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def build_simple_pdf(rows):
    lines = [' | '.join(str(cell) for cell in row) for row in rows]
    stream_lines = ['BT', '/F1 9 Tf', '40 790 Td']
    for line in lines[:48]:
        stream_lines.append(f'({_pdf_escape(line[:110])}) Tj')
        stream_lines.append('0 -14 Td')
    stream_lines.append('ET')
    stream = '\n'.join(stream_lines).encode('latin-1', 'replace')

    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        b'<< /Length ' + str(len(stream)).encode('ascii') + b' >>\nstream\n' + stream + b'\nendstream',
    ]
    pdf = bytearray(b'%PDF-1.4\n')
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f'{index} 0 obj\n'.encode('ascii'))
        pdf.extend(obj)
        pdf.extend(b'\nendobj\n')
    xref_start = len(pdf)
    pdf.extend(f'xref\n0 {len(objects) + 1}\n'.encode('ascii'))
    pdf.extend(b'0000000000 65535 f \n')
    for offset in offsets[1:]:
        pdf.extend(f'{offset:010d} 00000 n \n'.encode('ascii'))
    pdf.extend(f'trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF'.encode('ascii'))
    return bytes(pdf)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_pdf(request):
    if not can_view_reports(request.user):
        return Response({'error': 'Not allowed'}, status=403)
    report_type = request.query_params.get('type', 'financial')
    fmt = request.query_params.get('format', 'pdf')
    rows = list(report_rows(report_type))

    if fmt in ('xlsx', 'excel'):
        try:
            from openpyxl import Workbook

            workbook = Workbook()
            sheet = workbook.active
            sheet.title = report_type[:31]
            for row in rows:
                sheet.append(row)
            output = BytesIO()
            workbook.save(output)
            content = output.getvalue()
            response = HttpResponse(content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="sall_report_{report_type}.xlsx"'
            return response
        except Exception:
            pass

    if fmt == 'pdf':
        content = build_simple_pdf(rows)
        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="sall_report_{report_type}.pdf"'
        return response

    output = StringIO()
    writer = csv.writer(output)
    writer.writerows(rows)
    response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="sall_report_{report_type}.csv"'
    return response
