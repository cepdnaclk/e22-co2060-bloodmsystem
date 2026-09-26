import uuid
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.UserAuth.models.hospital import Hospital
from apps.UserAuth.models.models import Profile
from apps.donor.models.bloodCamp import BloodCamp
from apps.donor.models.campRegistration import CampRegistration
from apps.donor.models.donorDetails import DonorDetails, DONATION_GAP_DAYS

User = get_user_model()


class DonorUnitTests(TestCase):
    """
    Unit tests for DonorDetails model, 90-day eligibility logic, and BloodCamp attributes.
    """

    def setUp(self):
        self.today = timezone.localdate()
        self.user = User.objects.create_user(
            username="donorUnit",
            email="donorunit@hopedrop.com",
            password="Password123!"
        )
        self.user.role = User.DONOR
        self.user.save()
        Profile.objects.create(
            user=self.user,
            fullName="Unit Donor",
            nic_number="199212345678",
            blood_group="A+"
        )

    def test_donor_details_never_donated_is_eligible(self):
        """A new donor who has never donated should be immediately eligible."""
        donor = DonorDetails.objects.create(user=self.user)
        self.assertIsNone(donor.next_eligible_date)
        self.assertTrue(donor.is_eligible)

    def test_donor_details_recent_donation_is_ineligible(self):
        """A donor who donated 30 days ago should NOT be eligible under the 90-day rule."""
        last_donation = self.today - timedelta(days=30)
        donor = DonorDetails.objects.create(user=self.user, last_donation_date=last_donation)

        expected_next = last_donation + timedelta(days=DONATION_GAP_DAYS)
        self.assertEqual(donor.next_eligible_date, expected_next)
        self.assertFalse(donor.is_eligible)

    def test_donor_details_past_90_days_is_eligible(self):
        """A donor who donated 95 days ago should be eligible to donate again."""
        last_donation = self.today - timedelta(days=95)
        donor = DonorDetails.objects.create(user=self.user, last_donation_date=last_donation)

        self.assertTrue(donor.is_eligible)

    def test_donor_qr_id_auto_generation(self):
        """Each DonorDetails instance should automatically generate a unique valid UUID4 qr_id."""
        donor = DonorDetails.objects.create(user=self.user)
        self.assertIsNotNone(donor.qr_id)
        # Verify valid UUID
        self.assertIsInstance(donor.qr_id, uuid.UUID)


class DonorIntegrationTests(APITestCase):
    """
    Integration tests for Camp Registration workflow, duplicate prevention, and public QR lookup.
    """

    def setUp(self):
        self.today = timezone.localdate()
        self.organizer = User.objects.create_user(
            username="campOrg01",
            email="org@hopedrop.com",
            password="Password123!"
        )
        self.organizer.role = User.BLOODCAMP
        self.organizer.save()

        self.hospital = Hospital.objects.create(hosName="City Hospital", address="Kandy")

        self.camp = BloodCamp.objects.create(
            title="Kandy Town Blood Drive",
            date=self.today + timedelta(days=7),
            start_time="09:00:00",
            end_time="15:00:00",
            location="Kandy City Center",
            organizer=self.organizer,
            destination_hospital=self.hospital
        )

        self.donor_user = User.objects.create_user(
            username="donorInt",
            email="donorint@hopedrop.com",
            password="Password123!"
        )
        self.donor_user.role = User.DONOR
        self.donor_user.save()
        Profile.objects.create(
            user=self.donor_user,
            fullName="Integration Donor",
            nic_number="199412345678",
            blood_group="O+"
        )
        self.donor_details = DonorDetails.objects.create(user=self.donor_user)

    def test_camp_registration_state_machine(self):
        """CampRegistration should progress through valid lifecycle statuses."""
        registration = CampRegistration.objects.create(
            donor=self.donor_details,
            camp=self.camp,
            status="registered"
        )
        self.assertEqual(registration.status, "registered")

        # Step 2: Mark arrived
        registration.status = "arrived"
        registration.save()
        self.assertEqual(CampRegistration.objects.get(id=registration.id).status, "arrived")

        # Step 3: Screening
        registration.status = "screening"
        registration.save()
        self.assertEqual(CampRegistration.objects.get(id=registration.id).status, "screening")

        # Step 4: Approved
        registration.status = "approved"
        registration.save()
        self.assertEqual(CampRegistration.objects.get(id=registration.id).status, "approved")

        # Step 5: Donated
        registration.status = "donated"
        registration.save()
        self.assertEqual(CampRegistration.objects.get(id=registration.id).status, "donated")

    def test_duplicate_camp_registration_prevented(self):
        """Registering the same donor twice for the same camp must raise IntegrityError."""
        CampRegistration.objects.create(donor=self.donor_details, camp=self.camp)

        with self.assertRaises(IntegrityError):
            CampRegistration.objects.create(donor=self.donor_details, camp=self.camp)

    def test_public_donor_scan_api(self):
        """GET /api/v1/donor/public/<uuid:qr_id>/ should return public donor details without auth."""
        url = f"/api/v1/donor/public/{self.donor_details.qr_id}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["donor_name"], "Integration Donor")
        self.assertEqual(response.data["blood_group"], "O+")
        self.assertTrue(response.data["is_eligible"])
        self.assertTrue(response.data["is_available"])

    def test_upcoming_camps_endpoint(self):
        """GET /api/v1/donor/camps/upcoming/ should list future blood camps."""
        token = RefreshToken.for_user(self.donor_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")

        response = self.client.get("/api/v1/donor/camps/upcoming/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        titles = [camp["title"] for camp in response.data]
        self.assertIn("Kandy Town Blood Drive", titles)
from tests.test_donor import DonorWorkflowTests

__all__ = ["DonorWorkflowTests"]
