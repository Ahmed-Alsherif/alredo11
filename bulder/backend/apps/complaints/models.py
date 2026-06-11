from django.db import models
from django.conf import settings


class Complaint(models.Model):
    """شكوى — F6"""

    class Status(models.TextChoices):
        NEW = 'new', 'New'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'

    class Type(models.TextChoices):
        LATE = 'late', 'Late Collection'
        DAMAGED = 'damaged', 'Damaged Bin'
        MISSING = 'missing', 'Missing Collection'
        OTHER = 'other', 'Other'

    subscriber = models.ForeignKey(
        'subscribers.Subscriber', on_delete=models.CASCADE,
        related_name='complaints', verbose_name='Subscriber'
    )
    type = models.CharField(max_length=20, choices=Type.choices, verbose_name='Type')
    description = models.TextField(verbose_name='Description')
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.NEW, verbose_name='Status')
    image = models.ImageField(upload_to='complaints/', blank=True, null=True, verbose_name='Image')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Complaint'
        verbose_name_plural = 'Complaints'
        ordering = ['-created_at']

    def __str__(self):
        return f"Complaint #{self.id} — {self.get_type_display()}"


class FieldReport(models.Model):
    """بلاغ ميداني من السائق — FR-06-03"""

    class IssueType(models.TextChoices):
        FULL = 'full', 'Full Bin'
        DAMAGED = 'damaged', 'Damaged Bin'
        MISSING = 'missing', 'Missing Bin'
        EMPTY = 'empty', 'Empty Bin'

    driver = models.ForeignKey(
        'accounts.DriverProfile', on_delete=models.CASCADE,
        related_name='field_reports', verbose_name='Driver'
    )
    subscriber = models.ForeignKey(
        'subscribers.Subscriber', on_delete=models.CASCADE,
        null=True, blank=True, related_name='field_reports', verbose_name='Subscriber'
    )
    issue_type = models.CharField(max_length=20, choices=IssueType.choices, verbose_name='Issue Type')
    note = models.TextField(blank=True, verbose_name='Note')
    image = models.ImageField(upload_to='field_reports/', blank=True, null=True, verbose_name='Image')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Field Report'
        verbose_name_plural = 'Field Reports'
        ordering = ['-created_at']


class ServiceRating(models.Model):
    """تقييم الخدمة — FR-06-04"""
    subscriber = models.ForeignKey(
        'subscribers.Subscriber', on_delete=models.CASCADE,
        related_name='ratings', verbose_name='Subscriber'
    )
    month = models.DateField(verbose_name='Month')
    rating = models.IntegerField(verbose_name='Rating (1-5)')
    comment = models.TextField(blank=True, verbose_name='Comment')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Service Rating'
        verbose_name_plural = 'Service Ratings'
        unique_together = ['subscriber', 'month']
