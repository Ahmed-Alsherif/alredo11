import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
import django
django.setup()
from apps.accounts.models import User

accounts = ['admin', 'accountant', 'accountant1', 'driver1', 'driver2', 'agent1', 'sub1', 'late_sub']
for uname in accounts:
    try:
        u = User.objects.get(username=uname)
        u.set_password('123456')
        u.save()
        print(f'OK: {uname} | role={u.role} | password=123456')
    except Exception as e:
        print(f'FAIL: {uname}: {e}')
