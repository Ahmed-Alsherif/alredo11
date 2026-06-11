import math

from django.utils import timezone

from apps.notifications.models import Notification
from apps.subscribers.models import Subscriber


def notify_truck_proximity(driver, lat, lng):
    zone = driver.profile_zone
    if not zone:
        return
    subscribers = Subscriber.objects.filter(
        zone=zone,
        is_paused=False,
        archived_at__isnull=True,
        latitude__isnull=False,
        longitude__isnull=False,
    ).select_related('user')

    for sub in subscribers:
        dist = haversine_distance(lat, lng, sub.latitude, sub.longitude)
        if dist <= 500:
            already_sent = Notification.objects.filter(
                recipient=sub.user,
                type='truck',
                created_at__date=timezone.now().date(),
            ).exists()
            if not already_sent:
                Notification.objects.create(
                    recipient=sub.user,
                    type='truck',
                    title='Truck is near your home',
                    body=f'The collection truck is about {int(dist)} meters away.',
                )


def notify_field_report(field_report):
    from apps.accounts.models import User

    if field_report.subscriber:
        Notification.objects.create(
            recipient=field_report.subscriber.user,
            type='complaint',
            title=f'Field report: {field_report.get_issue_type_display()}',
            body=field_report.note or field_report.get_issue_type_display(),
        )
    for admin in User.objects.filter(role=User.Role.ADMIN):
        Notification.objects.create(
            recipient=admin,
            type='complaint',
            title=f'New field report: {field_report.get_issue_type_display()}',
            body=f'From driver {field_report.driver.display_name}: {field_report.note or ""}',
        )


def check_subscription_expiry():
    today = timezone.now().date()
    expiring_soon = Subscriber.objects.filter(
        subscription_end__lte=today + timezone.timedelta(days=7),
        subscription_end__gte=today,
        is_paused=False,
        archived_at__isnull=True,
    ).select_related('user')
    expired = Subscriber.objects.filter(
        subscription_end__lt=today,
        is_paused=False,
        archived_at__isnull=True,
    ).select_related('user')

    for sub in expiring_soon:
        days_left = (sub.subscription_end - today).days
        if not Notification.objects.filter(recipient=sub.user, type='payment', created_at__date=today, title__contains='expires').exists():
            Notification.objects.create(
                recipient=sub.user,
                type='payment',
                title=f'Your subscription expires in {days_left} days',
                body='Please renew your subscription to keep the service active.',
            )

    for sub in expired:
        if not Notification.objects.filter(recipient=sub.user, type='payment', created_at__date=today, title__contains='expired').exists():
            Notification.objects.create(
                recipient=sub.user,
                type='payment',
                title='Your subscription has expired',
                body='Please contact your zone agent to renew.',
            )
        sub.update_color_status()

    return {'expiring_soon': expiring_soon.count(), 'expired': expired.count()}


def haversine_distance(lat1, lon1, lat2, lon2):
    radius = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c
