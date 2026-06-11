from apps.accounts.models import User
users = User.objects.all()
output = []
for u in users:
    u.set_password('123456')
    u.save()
    output.append(f'Role: {u.role}, Username: {u.username}')
print('---USERS---')
print('\n'.join(output))
