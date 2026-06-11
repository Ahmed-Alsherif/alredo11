from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('Username must be provided')
        if not email:
            raise ValueError('Email must be provided')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    جدول المستخدم — فقط للمصادقة والربط
    يحتوي على: اسم المستخدم، كلمة المرور، البريد، الدور
    باقي البيانات الشخصية في جدول كل شخص
    """

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        ACCOUNTANT = 'accountant', 'Accountant'
        DRIVER = 'driver', 'Driver'
        AGENT = 'agent', 'Agent'
        SUBSCRIBER = 'subscriber', 'Subscriber'

    username = models.CharField(max_length=150, unique=True, verbose_name='Username')
    email = models.EmailField(unique=True, verbose_name='Email')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.SUBSCRIBER, verbose_name='Role')
    
    is_active = models.BooleanField(default=True, verbose_name='Is Active')
    is_staff = models.BooleanField(default=False, verbose_name='Is Staff')
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name='Date Joined')

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def profile(self):
        """الحصول على البروفايل المناسب حسب الدور"""
        try:
            if self.role == 'subscriber':
                return self.subscriber_profile
            elif self.role in ('driver', 'agent', 'accountant'):
                emp = self.employee_profile
                if self.role == 'driver':
                    return emp.driver_profile
                elif self.role == 'agent':
                    return emp.agent_profile
                elif self.role == 'accountant':
                    return emp.accountant_profile
        except Exception:
            pass
        return None

    @property
    def employee(self):
        """الحصول على EmployeeProfile إن وُجد"""
        try:
            return self.employee_profile
        except EmployeeProfile.DoesNotExist:
            return None

    @property
    def display_name(self):
        """الاسم من البروفايل"""
        # للموظفين: الاسم من EmployeeProfile
        emp = self.employee
        if emp:
            return f"{emp.first_name} {emp.last_name}".strip()
        # للمشتركين: الاسم من Subscriber
        try:
            if self.role == 'subscriber':
                sub = self.subscriber_profile
                return f"{sub.first_name} {sub.last_name}".strip()
        except Exception:
            pass
        return self.username

    def get_full_name(self):
        return self.display_name

    def get_short_name(self):
        emp = self.employee
        if emp and emp.first_name:
            return emp.first_name
        return self.username

    @property
    def profile_zone(self):
        """المنطقة من الجدول الفرعي (Driver أو Agent)"""
        p = self.profile
        if p and hasattr(p, 'zone'):
            return p.zone
        return None

    @property
    def profile_zone_name(self):
        z = self.profile_zone
        return z.name if z else None

    @property
    def profile_phone(self):
        emp = self.employee
        if emp:
            return emp.phone
        return ''

    @property
    def is_active_employee(self):
        emp = self.employee
        if emp:
            return emp.is_active
        return True


class EmployeeProfile(models.Model):
    """
    جدول الموظف المشترك — الطبقة الوسطى
    يحتوي البيانات المشتركة بين كل الموظفين (سائق، مندوب، محاسب)
    """
    user = models.OneToOneField(
        User, on_delete=models.CASCADE,
        related_name='employee_profile', verbose_name='User Account'
    )
    first_name = models.CharField(max_length=100, verbose_name='First Name')
    last_name = models.CharField(max_length=100, blank=True, verbose_name='Last Name')
    phone = models.CharField(max_length=15, blank=True, verbose_name='Phone')
    is_active = models.BooleanField(default=True, verbose_name='Is Active')

    class Meta:
        verbose_name = 'Employee Profile'
        verbose_name_plural = 'Employee Profiles'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.user.get_role_display()})"


class DriverProfile(models.Model):
    """جدول السائق — البيانات الخاصة بالسائق فقط"""
    employee = models.OneToOneField(
        EmployeeProfile, on_delete=models.CASCADE,
        related_name='driver_profile', verbose_name='Employee'
    )
    zone = models.ForeignKey(
        'zones.Zone', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='drivers', verbose_name='Zone'
    )
    license_number = models.CharField(max_length=30, blank=True, verbose_name='License Number')
    truck_number = models.CharField(max_length=20, blank=True, verbose_name='Truck Number')

    class Meta:
        verbose_name = 'Driver Profile'
        verbose_name_plural = 'Driver Profiles'

    def __str__(self):
        return f"{self.employee.first_name} {self.employee.last_name}"


class AgentProfile(models.Model):
    """جدول المندوب — البيانات الخاصة بالمندوب فقط"""
    employee = models.OneToOneField(
        EmployeeProfile, on_delete=models.CASCADE,
        related_name='agent_profile', verbose_name='Employee'
    )
    zone = models.ForeignKey(
        'zones.Zone', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='agents', verbose_name='Zone'
    )
    custody_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        verbose_name='Custody Amount'
    )

    class Meta:
        verbose_name = 'Agent Profile'
        verbose_name_plural = 'Agent Profiles'

    def __str__(self):
        return f"{self.employee.first_name} {self.employee.last_name}"


class AccountantProfile(models.Model):
    """جدول المحاسب — فارغ حالياً، جاهز لحقول مستقبلية"""
    employee = models.OneToOneField(
        EmployeeProfile, on_delete=models.CASCADE,
        related_name='accountant_profile', verbose_name='Employee'
    )

    class Meta:
        verbose_name = 'Accountant Profile'
        verbose_name_plural = 'Accountant Profiles'

    def __str__(self):
        return f"{self.employee.first_name} {self.employee.last_name}"


class EmployeeDocument(models.Model):
    class DocumentType(models.TextChoices):
        NATIONAL_ID = 'national_id', 'National ID'
        DRIVER_LICENSE = 'driver_license', 'Driver license'
        CONTRACT = 'contract', 'Contract'
        OTHER = 'other', 'Other'

    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        related_name='documents',
    )
    document_type = models.CharField(max_length=30, choices=DocumentType.choices, default=DocumentType.OTHER)
    title = models.CharField(max_length=120)
    file = models.FileField(upload_to='employee_documents/', blank=True, null=True)
    notes = models.TextField(blank=True)
    expires_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee} - {self.title}"
