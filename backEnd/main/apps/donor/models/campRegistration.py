import django.db.models.deletion
from django.conf import settings
from django.db import models

from .bloodCamp import BloodCamp
from .donorDetails import DonorDetails


class CampRegistration(models.Model):
    """
    Model representing a donor's request to register/donate at a specific Blood Camp.
    """
    STATUS_CHOICES = [
        ("registered", "Registered"),
        ("arrived", "Arrived"),
        ("screening", "Screening"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("donated", "Donated"),
    ]

    donor = models.ForeignKey(
        DonorDetails, on_delete=models.CASCADE, related_name="camp_registrations"
    )
    camp = models.ForeignKey(
        BloodCamp, on_delete=models.CASCADE, related_name="registrations"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="registered"
    )
    appointment_time = models.TimeField(null=True, blank=True)
    arrived_at = models.DateTimeField(null=True, blank=True)
    screened_at = models.DateTimeField(null=True, blank=True)
    screened_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=django.db.models.deletion.SET_NULL,
        related_name="screened_camp_registrations",
        limit_choices_to={"role": "doctor"},
    )
    rejection_reason = models.TextField(blank=True)
    collected_at = models.DateTimeField(null=True, blank=True)
    collected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=django.db.models.deletion.SET_NULL,
        related_name="collected_camp_registrations",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Camp Registration"
        verbose_name_plural = "Camp Registrations"
        unique_together = ("donor", "camp")  # Prevent duplicate registrations

    def __str__(self):
        return f"{self.donor.user.username} - {self.camp.title} ({self.status})"
