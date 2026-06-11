from django.db import models


class Zone(models.Model):
    """منطقة جغرافية — F1"""

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'

    name = models.CharField(max_length=100, unique=True, verbose_name='Name')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE, verbose_name='Status')
    # حدود المنطقة — مخزنة كقائمة إحداثيات JSON
    boundaries = models.JSONField(default=list, blank=True, verbose_name='Boundaries (Coordinates)')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Zone'
        verbose_name_plural = 'Zones'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def subscribers_count(self):
        return self.subscribers.count()

    @property
    def drivers_count(self):
        return self.drivers.count()

    @property
    def agents_count(self):
        return self.agents.count()


class Route(models.Model):
    """مسار جمع — F1"""

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        FROZEN = 'frozen', 'Frozen'

    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='routes', verbose_name='Zone')
    collection_days = models.JSONField(default=list, verbose_name='Collection Days')  # ["السبت", "الثلاثاء"]
    driver = models.ForeignKey(
        'accounts.DriverProfile', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='routes', verbose_name='Driver'
    )
    boundaries = models.JSONField(default=list, blank=True, verbose_name='Boundaries (Coordinates)')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE, verbose_name='Status')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Route'
        verbose_name_plural = 'Routes'

    def __str__(self):
        return f"Route - {self.zone.name}"
