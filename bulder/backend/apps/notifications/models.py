from django.db import models
from django.conf import settings


class Notification(models.Model):
    """إشعار — F3"""

    class Type(models.TextChoices):
        TRUCK = 'truck', 'Truck'
        PAYMENT = 'payment', 'Payment'
        COMPLAINT = 'complaint', 'Complaint'
        RECYCLE = 'recycle', 'Recycle'
        SYSTEM = 'system', 'System'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications', verbose_name='Recipient'
    )
    type = models.CharField(max_length=15, choices=Type.choices, default=Type.SYSTEM, verbose_name='Type')
    title = models.CharField(max_length=200, verbose_name='Title')
    body = models.TextField(blank=True, verbose_name='Body')
    is_read = models.BooleanField(default=False, verbose_name='Is Read')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date')

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
