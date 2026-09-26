from django.conf import settings
from django.db import models


class WorkflowNotification(models.Model):
    EVENT_CHOICES = [
        ("donor_registered", "Donor Registered"),
        ("donor_arrived", "Donor Arrived"),
        ("donor_screening", "Donor In Screening"),
        ("donor_approved", "Donor Approved"),
        ("donor_rejected", "Donor Rejected"),
        ("donor_donated", "Donor Donated"),
        ("info", "Information"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workflow_notifications",
    )
    event_type = models.CharField(max_length=30, choices=EVENT_CHOICES, default="info")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.event_type}"
