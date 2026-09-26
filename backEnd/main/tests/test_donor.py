from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.UserAuth.models import Profile
from apps.UserAuth.models.location import Country, District
from apps.donor.models.bloodCamp import BloodCamp
from apps.donor.models.campRegistration import CampRegistration
from apps.donor.models.donationHistory import DonationHistory
from apps.donor.models.donorAlert import DonorAlert
from apps.donor.models.donorDetails import DonorDetails

User = get_user_model()


class DonorWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(countryName="Sri Lanka", countryCode="LK")
        self.district = District.objects.create(districtName="Colombo", country=self.country)

        # Donor user
        self.donor_user = User.objects.create_user(
            username="donoruser",
            email="donor@example.com",
            password="Password123!",
            role=User.DONOR
        )
        self.donor_profile = Profile.objects.create(
            user=self.donor_user,
            fullName="Jane Donor",
            nic_number="199812345678",
            blood_group="O+",
            country=self.country,
            district=self.district
        )
        self.donor_details = DonorDetails.objects.create(
            user=self.donor_user,
            is_eligible=True,
            total_donations=2
        )

        # Organizer user
        self.organizer_user = User.objects.create_user(
            username="organizer1",
            email="organizer@example.com",
            password="Password123!",
            role=User.BLOODCAMP
        )

        # Blood Camp
        self.camp = BloodCamp.objects.create(
            title="City Central Blood Drive",
            date=date.today() + timedelta(days=5),
            start_time="09:00",
            end_time="16:00",
            location="Viharamahadevi Park, Colombo",
            organizer=self.organizer_user,
            district=self.district,
            status="upcoming"
        )

    def test_upcoming_blood_camps_public_api(self):
        response = self.client.get("/api/v1/donor/camps/upcoming/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return a list containing the upcoming camp
        results = response.data if isinstance(response.data, list) else response.data.get("results", [])
        camp_titles = [c.get("title") or c.get("name") for c in results]
        self.assertIn("City Central Blood Drive", camp_titles)

    def test_camp_registration_and_workflow(self):
        self.client.force_authenticate(user=self.donor_user)
        # Register for camp
        reg = CampRegistration.objects.create(
            camp=self.camp,
            donor=self.donor_user,
            status="registered"
        )
        self.assertEqual(reg.status, "registered")

        # Mark as arrived
        reg.status = "arrived"
        reg.save()
        self.assertEqual(CampRegistration.objects.get(id=reg.id).status, "arrived")

        # Screening approved
        reg.status = "screening"
        reg.save()
        self.assertEqual(CampRegistration.objects.get(id=reg.id).status, "screening")

    def test_donation_history_listing(self):
        DonationHistory.objects.create(
            donor=self.donor_user,
            blood_camp=self.camp,
            donation_date=date.today() - timedelta(days=90),
            units_donated=1,
            blood_group="O+",
            status="completed"
        )

        self.client.force_authenticate(user=self.donor_user)
        response = self.client.get("/api/v1/donor/donations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_donor_alerts(self):
        alert = DonorAlert.objects.create(
            donor=self.donor_user,
            title="Urgent O+ Needed",
            message="National blood bank has low stock for O+.",
            alert_type="urgent",
            is_read=False
        )

        self.client.force_authenticate(user=self.donor_user)
        response = self.client.get("/api/v1/donor/alerts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Mark read
        read_response = self.client.post(f"/api/v1/donor/alerts/{alert.id}/read/")
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        alert.refresh_from_db()
        self.assertTrue(alert.is_read)
