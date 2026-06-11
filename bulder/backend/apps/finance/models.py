from django.conf import settings
from django.db import models


class CollectionSettlement(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Approval'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    agent = models.ForeignKey(
        'accounts.AgentProfile',
        on_delete=models.CASCADE,
        related_name='settlements',
        verbose_name='Agent'
    )
    accountant = models.ForeignKey(
        'accounts.AccountantProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_settlements',
        verbose_name='Accountant'
    )
    date = models.DateField(auto_now_add=True, verbose_name='Date')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Total Amount')
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING, verbose_name='Status')
    note = models.TextField(blank=True, verbose_name='Notes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Collection Settlement'
        verbose_name_plural = 'Collection Settlements'
        ordering = ['-date', '-id']

    def __str__(self):
        return f"Settlement {self.id} - {self.agent} - {self.total_amount}"


class Payment(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = 'confirmed', 'Confirmed'
        PENDING_DEPOSIT = 'pending', 'Pending deposit'
        DEPOSITED = 'deposited', 'Deposited'

    subscriber = models.ForeignKey('subscribers.Subscriber', on_delete=models.CASCADE, related_name='payments')
    plan = models.ForeignKey(
        'subscribers.SubscriptionPlan',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
        verbose_name='Subscription Plan'
    )
    agent = models.ForeignKey(
        'accounts.AgentProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='collections',
    )
    settlement = models.ForeignKey(
        CollectionSettlement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
        verbose_name='Settlement Session'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING_DEPOSIT)
    receipt_number = models.CharField(max_length=20, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-date', '-id']

    def __str__(self):
        return f"{self.amount} - {self.subscriber}"

    def save(self, *args, **kwargs):
        creating_without_receipt = not self.receipt_number
        super().save(*args, **kwargs)
        if creating_without_receipt:
            self.receipt_number = f"REC-{self.pk:06d}"
            super().save(update_fields=['receipt_number'])
        self.subscriber.update_color_status()


class Expense(models.Model):
    class Category(models.TextChoices):
        FUEL = 'fuel', 'Fuel'
        MAINTENANCE = 'maintenance', 'Maintenance'
        SALARY = 'salary', 'Salary'
        MARKETING = 'marketing', 'Marketing'
        OTHER = 'other', 'Other'

    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=15, choices=Category.choices, default=Category.OTHER)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Expense'
        verbose_name_plural = 'Expenses'
        ordering = ['-date', '-id']

    def __str__(self):
        return f"{self.description} - {self.amount}"


class Advance(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        PAID = 'paid', 'Paid'

    employee = models.ForeignKey('accounts.EmployeeProfile', on_delete=models.CASCADE, related_name='advances')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    date = models.DateField(auto_now_add=True)
    note = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Advance'
        verbose_name_plural = 'Advances'
        ordering = ['-date', '-id']


class Penalty(models.Model):
    employee = models.ForeignKey('accounts.EmployeeProfile', on_delete=models.CASCADE, related_name='penalties')
    reason = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    date = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name = 'Penalty'
        verbose_name_plural = 'Penalties'
        ordering = ['-date', '-id']


class StaffReward(models.Model):
    employee = models.ForeignKey('accounts.EmployeeProfile', on_delete=models.CASCADE, related_name='staff_rewards')
    reason = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    date = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name = 'Staff reward'
        verbose_name_plural = 'Staff rewards'
        ordering = ['-date', '-id']
