"""FR-03-03: فحص انتهاء الاشتراكات وإرسال تنبيهات"""
from django.core.management.base import BaseCommand
from apps.notifications.services import check_subscription_expiry


class Command(BaseCommand):
    help = 'فحص الاشتراكات المنتهية وإرسال تنبيهات'

    def handle(self, *args, **options):
        result = check_subscription_expiry()
        self.stdout.write(self.style.SUCCESS(
            f'تم فحص الاشتراكات: {result["expiring_soon"]} قريبة الانتهاء، {result["expired"]} منتهية'
        ))
