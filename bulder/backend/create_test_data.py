import os
import django
import random
from datetime import date, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User, DriverProfile, AgentProfile, EmployeeDocument
from apps.zones.models import Zone, Route
from apps.subscribers.models import Subscriber, SubscriptionPlan
from apps.finance.models import Payment, Expense, Advance
from apps.tracking.models import TruckLocation, CollectionVisit
from apps.recycling.models import RecycleRequest
from apps.complaints.models import Complaint

def populate_database():
    print("--- Start populating realistic test data ---")

    # Wipe existing data if you want a clean slate, or just keep adding.
    # For a clean slate on some models:
    Zone.objects.all().delete()
    SubscriptionPlan.objects.all().delete()
    User.objects.exclude(username__in=['admin', 'accountant1']).delete()

    # 1. Zones
    zones_data = [
        {"name": "حي الملقا", "boundaries": [{"lat": 24.8028, "lng": 46.6111}, {"lat": 24.8150, "lng": 46.6200}, {"lat": 24.8100, "lng": 46.6350}, {"lat": 24.7950, "lng": 46.6250}]},
        {"name": "حي الياسمين", "boundaries": [{"lat": 24.8118, "lng": 46.6431}, {"lat": 24.8250, "lng": 46.6500}, {"lat": 24.8200, "lng": 46.6650}, {"lat": 24.8050, "lng": 46.6550}]},
        {"name": "حي النرجس", "boundaries": [{"lat": 24.8318, "lng": 46.6731}, {"lat": 24.8450, "lng": 46.6800}, {"lat": 24.8400, "lng": 46.6950}, {"lat": 24.8250, "lng": 46.6850}]},
        {"name": "حي الصحافة", "boundaries": [{"lat": 24.7918, "lng": 46.6231}, {"lat": 24.8050, "lng": 46.6300}, {"lat": 24.8000, "lng": 46.6450}, {"lat": 24.7850, "lng": 46.6350}]},
    ]
    zones = []
    for z in zones_data:
        obj, _ = Zone.objects.update_or_create(name=z['name'], defaults={"status": "active", "boundaries": z['boundaries']})
        zones.append(obj)
    
    # 2. Plans
    plans_data = [
        {"name": "باقة شهرية", "duration": 1, "price": 100},
        {"name": "باقة ربع سنوية", "duration": 3, "price": 270},
        {"name": "باقة نصف سنوية", "duration": 6, "price": 500},
        {"name": "باقة سنوية", "duration": 12, "price": 900},
    ]
    plans = []
    for p in plans_data:
        obj, _ = SubscriptionPlan.objects.update_or_create(name=p['name'], defaults={"duration_months": p['duration'], "price": p['price']})
        plans.append(obj)

    # 3. Drivers
    drivers_data = [
        {"user": "driver_fahad", "first": "فهد", "last": "المطيري", "phone": "0501112222", "truck": "TRK-101"},
        {"user": "driver_saad", "first": "سعد", "last": "الدوسري", "phone": "0503334444", "truck": "TRK-202"},
        {"user": "driver_omar", "first": "عمر", "last": "الغامدي", "phone": "0505556666", "truck": "TRK-303"},
    ]
    drivers = []
    for d in drivers_data:
        u, _ = User.objects.get_or_create(username=d['user'], defaults={"email": f"{d['user']}@ex.com", "role": "driver"})
        u.set_password("123456")
        u.save()
        dp, _ = DriverProfile.objects.update_or_create(user=u, defaults={"first_name": d['first'], "last_name": d['last'], "phone": d['phone'], "zone": random.choice(zones), "truck_number": d['truck']})
        drivers.append(u)

    # 4. Agents
    agents_data = [
        {"user": "agent_ali", "first": "علي", "last": "الشهري", "phone": "0551112222"},
        {"user": "agent_yasser", "first": "ياسر", "last": "القحطاني", "phone": "0553334444"},
    ]
    agents = []
    for a in agents_data:
        u, _ = User.objects.get_or_create(username=a['user'], defaults={"email": f"{a['user']}@ex.com", "role": "agent"})
        u.set_password("123456")
        u.save()
        ap, _ = AgentProfile.objects.update_or_create(user=u, defaults={"first_name": a['first'], "last_name": a['last'], "phone": a['phone'], "zone": random.choice(zones)})
        agents.append(u)

    # 5. Subscribers
    subs_data = [
        {"user": "sub_khaled", "first": "خالد", "last": "العنزي", "phone": "0531234567", "lat": 24.8050, "lng": 46.6150, "color": "green", "status": "active"},
        {"user": "sub_sultan", "first": "سلطان", "last": "العتيبي", "phone": "0539876543", "lat": 24.8150, "lng": 46.6450, "color": "yellow", "status": "active"},
        {"user": "sub_abdullah", "first": "عبدالله", "last": "الزهراني", "phone": "0561122334", "lat": 24.8350, "lng": 46.6750, "color": "red", "status": "active", "excuse": "مسافر خارج المملكة"},
        {"user": "sub_mohammed", "first": "محمد", "last": "الشمري", "phone": "0545566778", "lat": 24.7950, "lng": 46.6350, "color": "green", "status": "paused"},
        {"user": "sub_naif", "first": "نايف", "last": "الحربي", "phone": "0599988776", "lat": 24.8000, "lng": 46.6180, "color": "green", "status": "active"},
        {"user": "sub_abdulaziz", "first": "عبدالعزيز", "last": "القحطاني", "phone": "0587766554", "lat": 24.8200, "lng": 46.6500, "color": "yellow", "status": "active"},
        {"user": "sub_abdulrahman", "first": "عبدالرحمن", "last": "الشهراني", "phone": "0554433221", "lat": 24.8400, "lng": 46.6800, "color": "green", "status": "active"},
        {"user": "sub_saleh", "first": "صالح", "last": "الدوسري", "phone": "0533322111", "lat": 24.7900, "lng": 46.6300, "color": "red", "status": "active"},
        {"user": "sub_faisal", "first": "فيصل", "last": "السبيعي", "phone": "0509988776", "lat": 24.8100, "lng": 46.6200, "color": "green", "status": "active"},
        {"user": "sub_majed", "first": "ماجد", "last": "المالكي", "phone": "0566677889", "lat": 24.8250, "lng": 46.6600, "color": "green", "status": "active"},
    ]

    for i, s in enumerate(subs_data):
        u, _ = User.objects.get_or_create(username=s['user'], defaults={"email": f"{s['user']}@ex.com", "role": "subscriber"})
        u.set_password("123456")
        u.save()
        
        plan = random.choice(plans)
        end_date = date.today() + timedelta(days=30) if s['color'] == 'green' else (date.today() - timedelta(days=5) if s['color'] == 'yellow' else date.today() - timedelta(days=20))
        
        Subscriber.objects.update_or_create(
            user=u,
            defaults={
                "first_name": s['first'],
                "last_name": s['last'],
                "phone": s['phone'],
                "zone": random.choice(zones),
                "plan": plan,
                "latitude": s['lat'],
                "longitude": s['lng'],
                "color_status": s['color'],
                "subscription_end": end_date,
                "is_paused": s['status'] == 'paused',
                "address": f"فيلا {i*10}, شارع {s['first']}",
                "excuse": s.get('excuse', '')
            }
        )

    # 6. Routes
    routes_data = [
        {"zone": zones[0], "driver": drivers[0], "days": ["saturday", "tuesday"]},
        {"zone": zones[1], "driver": drivers[1], "days": ["sunday", "wednesday"]},
        {"zone": zones[2], "driver": drivers[2], "days": ["monday", "thursday"]},
        {"zone": zones[3], "driver": drivers[0], "days": ["friday"]},
    ]
    for r in routes_data:
        Route.objects.update_or_create(zone=r['zone'], driver=r['driver'], defaults={"collection_days": r['days'], "status": "active"})

    # 7. Finance Data (Payments, Expenses, Advances)
    for _ in range(15):
        Payment.objects.create(
            subscriber=Subscriber.objects.order_by('?').first(),
            agent=random.choice(agents),
            amount=random.choice([100, 270, 500]),
            status=random.choice(["confirmed", "pending", "deposited"])
        )
        
    for _ in range(8):
        Expense.objects.create(
            description=random.choice(["صيانة شاحنة", "وقود بنزين", "تسويق وحملات", "مصروفات نثرية"]),
            amount=random.choice([100, 250, 400, 1000]),
            category=random.choice(["fuel", "maintenance", "marketing", "other"])
        )
    
    for d in drivers + agents:
        Advance.objects.create(
            employee=d,
            amount=random.choice([200, 500]),
            status=random.choice(["active", "paid"]),
            note="سلفة طوارئ"
        )

    # 8. Recycle Requests
    for _ in range(12):
        RecycleRequest.objects.create(
            subscriber=Subscriber.objects.order_by('?').first(),
            category=random.choice(["plastic", "paper", "metal", "bread"]),
            bags_count=random.randint(1, 5),
            status=random.choice(["pending", "collected", "cancelled"])
        )

    # 9. Complaints
    for _ in range(5):
        Complaint.objects.create(
            subscriber=Subscriber.objects.order_by('?').first(),
            type=random.choice(["late", "damaged", "missing", "other"]),
            description="تفاصيل الشكوى التجريبية هنا...",
            status=random.choice(["new", "in_progress", "resolved"])
        )
    
    print("--- Done seeding realistic test data 100% ---")

if __name__ == "__main__":
    populate_database()
