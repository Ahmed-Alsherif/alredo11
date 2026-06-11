import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.subscribers.models import Subscriber, SubscriptionLog, SubscriptionPlan
from apps.finance.models import Payment
from apps.accounts.models import User
from django.utils import timezone
from datetime import timedelta

def main():
    # Delete old dummy logs
    SubscriptionLog.objects.all().delete()
    Payment.objects.all().delete()

    agent_user = User.objects.get(username='agent_ali')
    agent_profile = agent_user.profile
    
    plan = SubscriptionPlan.objects.first()
    
    subs = list(Subscriber.objects.filter(zone=agent_profile.zone))
    
    if len(subs) < 2:
        print("Not enough subscribers found.")
        return

    sub1, sub2 = subs[0], subs[1]
    now = timezone.now().date()

    # --- Subscriber 1: Paid both months ---
    # Month 1
    p1 = Payment.objects.create(
        subscriber=sub1, plan=plan, agent=agent_profile, amount=plan.price, status='deposited'
    )
    p1.date = now - timedelta(days=60)
    p1.save()
    SubscriptionLog.objects.create(
        subscriber=sub1, plan=plan, payment=p1, start_date=now-timedelta(days=60), end_date=now-timedelta(days=30)
    )

    # Month 2
    p2 = Payment.objects.create(
        subscriber=sub1, plan=plan, agent=agent_profile, amount=plan.price, status='pending'
    )
    p2.date = now - timedelta(days=30)
    p2.save()
    SubscriptionLog.objects.create(
        subscriber=sub1, plan=plan, payment=p2, start_date=now-timedelta(days=30), end_date=now
    )


    # --- Subscriber 2: Paid first month, unpaid second month ---
    # Month 1
    p3 = Payment.objects.create(
        subscriber=sub2, plan=plan, agent=agent_profile, amount=plan.price, status='deposited'
    )
    p3.date = now - timedelta(days=60)
    p3.save()
    SubscriptionLog.objects.create(
        subscriber=sub2, plan=plan, payment=p3, start_date=now-timedelta(days=60), end_date=now-timedelta(days=30)
    )

    # Month 2 (Unpaid)
    SubscriptionLog.objects.create(
        subscriber=sub2, plan=plan, start_date=now-timedelta(days=30), end_date=now
    )

    print("Realistic test data created successfully!")

if __name__ == '__main__':
    main()
