"""بذر البيانات التجريبية لنظام سل"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User
from apps.zones.models import Zone, Route
from apps.subscribers.models import Subscriber, SubscriptionPlan
from apps.notifications.models import Notification
from apps.complaints.models import Complaint
from apps.recycling.models import RecycleRequest, PointsTransaction
from apps.finance.models import Payment, Expense, Advance
from datetime import date, timedelta
from decimal import Decimal


class Command(BaseCommand):
    help = 'بذر بيانات تجريبية لنظام سل'

    def handle(self, *args, **options):
        self.stdout.write('🌱 بدء بذر البيانات...')

        # ── خطط الاشتراك ──
        plan_m, _ = SubscriptionPlan.objects.get_or_create(name='شهري', defaults={'duration_months': 1, 'price': 150})
        plan_q, _ = SubscriptionPlan.objects.get_or_create(name='3 أشهر', defaults={'duration_months': 3, 'price': 400})
        plan_s, _ = SubscriptionPlan.objects.get_or_create(name='6 أشهر', defaults={'duration_months': 6, 'price': 750})
        plan_y, _ = SubscriptionPlan.objects.get_or_create(name='سنوي', defaults={'duration_months': 12, 'price': 1400})
        self.stdout.write('  ✅ خطط الاشتراك')

        # ── المناطق ──
        zones_data = ['حي النسيم', 'حي الملقا', 'حي العليا', 'حي الروضة', 'حي السلام', 'حي الياسمين']
        zones = {}
        for name in zones_data:
            z, _ = Zone.objects.get_or_create(name=name)
            zones[name] = z
        self.stdout.write('  ✅ المناطق (6)')

        # ── المدير العام ──
        admin, created = User.objects.get_or_create(username='admin', defaults={
            'first_name': 'المدير', 'last_name': 'العام', 'role': 'admin',
            'phone': '0500000001', 'is_staff': True, 'is_superuser': True,
        })
        if created: admin.set_password('admin123'); admin.save()

        # ── المحاسب ──
        acc, created = User.objects.get_or_create(username='accountant', defaults={
            'first_name': 'فيصل', 'last_name': 'المطيري', 'role': 'accountant',
            'phone': '0500000002',
        })
        if created: acc.set_password('pass123'); acc.save()

        # ── السائقين ──
        drivers_data = [
            ('driver1', 'أحمد', 'العتيبي', 'حي النسيم'),
            ('driver2', 'ياسر', 'الغامدي', 'حي الملقا'),
            ('driver3', 'سعد', 'الشمري', 'حي العليا'),
        ]
        drivers = {}
        for uname, fn, ln, zname in drivers_data:
            d, created = User.objects.get_or_create(username=uname, defaults={
                'first_name': fn, 'last_name': ln, 'role': 'driver',
                'phone': f'050{hash(uname) % 10000000:07d}', 'zone': zones[zname],
            })
            if created: d.set_password('pass123'); d.save()
            drivers[uname] = d

        # ── المناديب ──
        agents_data = [
            ('agent1', 'خالد', 'القحطاني', 'حي النسيم'),
            ('agent2', 'عبدالرحمن', 'الحربي', 'حي الملقا'),
        ]
        agents = {}
        for uname, fn, ln, zname in agents_data:
            a, created = User.objects.get_or_create(username=uname, defaults={
                'first_name': fn, 'last_name': ln, 'role': 'agent',
                'phone': f'055{hash(uname) % 10000000:07d}', 'zone': zones[zname],
            })
            if created: a.set_password('pass123'); a.save()
            agents[uname] = a
        self.stdout.write('  ✅ الموظفون (8)')

        # ── المسارات ──
        Route.objects.get_or_create(zone=zones['حي النسيم'], defaults={
            'collection_days': ['السبت', 'الثلاثاء'], 'driver': drivers['driver1'],
        })
        Route.objects.get_or_create(zone=zones['حي الملقا'], defaults={
            'collection_days': ['الأحد', 'الأربعاء'], 'driver': drivers['driver2'],
        })
        Route.objects.get_or_create(zone=zones['حي العليا'], defaults={
            'collection_days': ['السبت', 'الإثنين', 'الأربعاء'], 'driver': drivers['driver3'],
        })
        self.stdout.write('  ✅ المسارات (3)')

        # ── المشتركين ──
        subs_data = [
            ('sub1', 'عبدالله', 'العمري', 'حي النسيم', plan_m, 'green', 24.7136, 46.6753),
            ('sub2', 'نورة', 'الزهراني', 'حي النسيم', plan_q, 'green', 24.7141, 46.6760),
            ('sub3', 'ماجد', 'الشهري', 'حي الملقا', plan_s, 'green', 24.7150, 46.6770),
            ('sub4', 'سارة', 'القحطاني', 'حي الملقا', plan_m, 'red', 24.7160, 46.6780),
            ('sub5', 'فهد', 'الراشد', 'حي العليا', plan_y, 'yellow', 24.7170, 46.6790),
            ('sub6', 'هند', 'المالكي', 'حي العليا', plan_m, 'green', 24.7180, 46.6800),
            ('sub7', 'محمد', 'الحربي', 'حي السلام', plan_q, 'green', 24.7190, 46.6810),
            ('sub8', 'عمر', 'السبيعي', 'حي الياسمين', plan_m, 'yellow', 24.7200, 46.6820),
        ]
        subscribers = {}
        for uname, fn, ln, zname, plan, color, lat, lng in subs_data:
            u, created = User.objects.get_or_create(username=uname, defaults={
                'first_name': fn, 'last_name': ln, 'role': 'subscriber',
                'phone': f'053{hash(uname) % 10000000:07d}',
            })
            if created: u.set_password('pass123'); u.save()
            sub, _ = Subscriber.objects.get_or_create(user=u, defaults={
                'zone': zones[zname], 'plan': plan, 'color_status': color,
                'latitude': lat, 'longitude': lng,
                'subscription_end': date.today() + timedelta(days=plan.duration_months * 30),
            })
            subscribers[uname] = sub
        self.stdout.write('  ✅ المشتركين (8)')

        # ── الإشعارات ──
        for user in User.objects.all()[:5]:
            Notification.objects.get_or_create(
                recipient=user, title='مرحباً في نظام سل!',
                defaults={'body': 'نظام إدارة النفايات والتدوير الذكي', 'type': 'system'}
            )
        self.stdout.write('  ✅ الإشعارات')

        # ── الشكاوى ──
        Complaint.objects.get_or_create(
            subscriber=subscribers['sub4'], type='late',
            defaults={'description': 'لم يتم جمع النفايات لمدة يومين', 'status': 'new'}
        )
        Complaint.objects.get_or_create(
            subscriber=subscribers['sub5'], type='damaged',
            defaults={'description': 'السلة مكسورة من الجانب', 'status': 'in_progress'}
        )
        self.stdout.write('  ✅ الشكاوى')

        # ── نقاط التدوير ──
        points_data = [('sub1', 750), ('sub3', 1250), ('sub6', 980), ('sub2', 520)]
        for uname, pts in points_data:
            PointsTransaction.objects.get_or_create(
                subscriber=subscribers[uname], points=pts,
                defaults={'reason': 'نقاط تراكمية من عمليات التدوير'}
            )
        self.stdout.write('  ✅ نقاط التدوير')

        # ── التحصيلات ──
        for sub_key in ['sub1', 'sub2', 'sub3', 'sub6', 'sub7']:
            Payment.objects.get_or_create(
                subscriber=subscribers[sub_key], agent=agents['agent1'],
                defaults={'amount': subscribers[sub_key].plan.price if subscribers[sub_key].plan else 150}
            )
        self.stdout.write('  ✅ التحصيلات')

        # ── المصروفات ──
        Expense.objects.get_or_create(description='وقود — شاحنة حي النسيم', defaults={'amount': 350, 'category': 'fuel'})
        Expense.objects.get_or_create(description='صيانة — إطارات شاحنة حي العليا', defaults={'amount': 1200, 'category': 'maintenance'})
        self.stdout.write('  ✅ المصروفات')

        # ── السُلف ──
        Advance.objects.get_or_create(employee=drivers['driver1'], defaults={'amount': 2000})
        self.stdout.write('  ✅ السُلف')

        self.stdout.write(self.style.SUCCESS('\n🎉 تم بذر جميع البيانات التجريبية بنجاح!'))
        self.stdout.write(self.style.SUCCESS('   👤 الدخول كمدير: admin / admin123'))
        self.stdout.write(self.style.SUCCESS('   🚛 الدخول كسائق: driver1 / pass123'))
        self.stdout.write(self.style.SUCCESS('   📋 الدخول كمندوب: agent1 / pass123'))
        self.stdout.write(self.style.SUCCESS('   🏠 الدخول كمشترك: sub1 / pass123'))
