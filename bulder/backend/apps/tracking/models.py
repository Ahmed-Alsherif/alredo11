from django.conf import settings
from django.db import models


class TruckLocation(models.Model):
    driver = models.ForeignKey(
        'accounts.DriverProfile',
        on_delete=models.CASCADE,
        related_name='locations',
    )
    latitude = models.FloatField()
    longitude = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Truck location'
        verbose_name_plural = 'Truck locations'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.driver.display_name} @ {self.timestamp}"


class CollectionVisit(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COLLECTED = 'collected', 'Collected'
        SKIPPED = 'skipped', 'Skipped'
        ISSUE = 'issue', 'Issue'

    route = models.ForeignKey('zones.Route', on_delete=models.CASCADE, related_name='visits')
    driver = models.ForeignKey(
        'accounts.DriverProfile',
        on_delete=models.CASCADE,
        related_name='collection_visits',
    )
    subscriber = models.ForeignKey('subscribers.Subscriber', on_delete=models.CASCADE, related_name='collection_visits')
    visit_date = models.DateField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    note = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['route', 'subscriber', 'visit_date']
        ordering = ['visit_date', 'id']

    def __str__(self):
        return f"{self.visit_date} - {self.subscriber} - {self.status}"
