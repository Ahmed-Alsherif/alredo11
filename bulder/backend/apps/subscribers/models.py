from django.conf import settings
from django.db import models
from django.utils import timezone


class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=50)
    duration_months = models.IntegerField()
    bins_count = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        verbose_name = 'Subscription plan'
        verbose_name_plural = 'Subscription plans'

    def __str__(self):
        return f"{self.name} - {self.price}"


class Subscriber(models.Model):
    class ColorStatus(models.TextChoices):
        GREEN = 'green', 'Green'
        YELLOW = 'yellow', 'Yellow'
        RED = 'red', 'Red'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriber_profile',
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    subscription_id = models.CharField(max_length=20, blank=True, default='', unique=True)
    zone = models.ForeignKey(
        'zones.Zone',
        on_delete=models.SET_NULL,
        null=True,
        related_name='subscribers',
    )
    route = models.ForeignKey(
        'zones.Route',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subscribers',
    )
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True)
    color_status = models.CharField(max_length=10, choices=ColorStatus.choices, default=ColorStatus.GREEN)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    address = models.CharField(max_length=255, blank=True)
    subscription_start = models.DateField(auto_now_add=True)
    subscription_end = models.DateField(null=True, blank=True)
    is_paused = models.BooleanField(default=False)
    paused_at = models.DateField(null=True, blank=True)
    excuse = models.TextField(blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    archive_reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Subscriber'
        verbose_name_plural = 'Subscribers'

    def __str__(self):
        return self.name or self.user.username

    @property
    def name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        if not self.subscription_id:
            last = Subscriber.objects.order_by('-id').first()
            next_num = (last.id + 1) if last else 1
            candidate = f"SUB-{next_num:04d}"
            while Subscriber.objects.filter(subscription_id=candidate).exclude(pk=self.pk).exists():
                next_num += 1
                candidate = f"SUB-{next_num:04d}"
            self.subscription_id = candidate
        super().save(*args, **kwargs)

    def update_color_status(self):
        if self.is_paused:
            self.color_status = self.ColorStatus.GREEN
        elif not self.subscription_end:
            self.color_status = self.ColorStatus.RED
        else:
            days_overdue = (timezone.now().date() - self.subscription_end).days
            if days_overdue <= 0:
                self.color_status = self.ColorStatus.GREEN
            elif days_overdue <= 30:
                self.color_status = self.ColorStatus.YELLOW
            else:
                self.color_status = self.ColorStatus.RED
        self.save(update_fields=['color_status'])

    def pause(self):
        self.is_paused = True
        self.paused_at = timezone.now().date()
        self.save(update_fields=['is_paused', 'paused_at'])

    def resume(self):
        if self.paused_at and self.subscription_end:
            paused_days = max((timezone.now().date() - self.paused_at).days, 0)
            self.subscription_end = self.subscription_end + timezone.timedelta(days=paused_days)
        self.is_paused = False
        self.paused_at = None
        self.save(update_fields=['is_paused', 'paused_at', 'subscription_end'])

    def archive(self, reason=''):
        self.archived_at = timezone.now()
        self.archive_reason = reason or ''
        self.save(update_fields=['archived_at', 'archive_reason'])


class SubscriptionLog(models.Model):
    subscriber = models.ForeignKey(Subscriber, on_delete=models.CASCADE, related_name='subscription_logs', verbose_name='Subscriber')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, verbose_name='Plan')
    payment = models.ForeignKey(
        'finance.Payment', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='subscription_logs', 
        verbose_name='Payment'
    )
    start_date = models.DateField(verbose_name='Start Date')
    end_date = models.DateField(verbose_name='End Date')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')

    class Meta:
        verbose_name = 'Subscription Log'
        verbose_name_plural = 'Subscription Logs'
        ordering = ['-start_date', '-id']

    def __str__(self):
        plan_name = self.plan.name if self.plan else 'Unknown Plan'
        return f"{self.subscriber.user.username} - {plan_name} ({self.start_date} to {self.end_date})"
