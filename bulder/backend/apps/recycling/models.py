from django.conf import settings
from django.db import models


class RecycleRequest(models.Model):
    class Category(models.TextChoices):
        PLASTIC = 'plastic', 'Plastic'
        METAL = 'metal', 'Metal'
        PAPER = 'paper', 'Paper'
        BREAD = 'bread', 'Bread'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COLLECTED = 'collected', 'Collected'
        CANCELLED = 'cancelled', 'Cancelled'

    subscriber = models.ForeignKey('subscribers.Subscriber', on_delete=models.CASCADE, related_name='recycle_requests')
    category = models.CharField(max_length=15, choices=Category.choices)
    bags_count = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    confirmed_by = models.ForeignKey(
        'accounts.DriverProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='confirmed_recycles',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Recycle request'
        verbose_name_plural = 'Recycle requests'
        ordering = ['-created_at']


class PointsTransaction(models.Model):
    subscriber = models.ForeignKey('subscribers.Subscriber', on_delete=models.CASCADE, related_name='points_transactions')
    recycle_request = models.OneToOneField(
        RecycleRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='points_transaction',
    )
    points = models.IntegerField()
    reason = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Points transaction'
        verbose_name_plural = 'Points transactions'
        ordering = ['-created_at']


class Reward(models.Model):
    subscriber = models.ForeignKey('subscribers.Subscriber', on_delete=models.CASCADE, related_name='rewards')
    title = models.CharField(max_length=200)
    month = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Reward'
        verbose_name_plural = 'Rewards'
        ordering = ['-created_at']
