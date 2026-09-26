from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.UserAuth.models import Profile
from apps.UserAuth.models.hospital import Hospital
from apps.UserAuth.models.location import Country, District
from apps.blood.bloodinventor.models.bloodinventor import BloodInventory
from apps.donor.models.bloodCamp import BloodCamp

User = get_user_model()


class AdminDashboardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(countryName="Sri Lanka", countryCode="LK")
        self.district = District.objects.create(districtName="Colombo", country=self.country)

        # Admin user
        self.admin_user = User.objects.create_user(
            username="admin01",
            email="admin01@example.com",
            password="AdminPassword123!",
            role=User.ADMIN
        )

        # Regular donor user
        self.donor_user = User.objects.create_user(
            username="donor01",
            email="donor01@example.com",
            password="DonorPassword123!",
            role=User.DONOR
        )
        self.donor_profile = Profile.objects.create(
            user=self.donor_user,
            fullName="Donor Profile",
            nic_number="200112345678",
            blood_group="AB+",
            country=self.country,
            district=self.district
        )

        # Doctor user
        self.doctor_user = User.objects.create_user(
            username="doctor01",
            email="doctor01@example.com",
            password="DoctorPassword123!",
            role=User.DOCTOR
        )

        # Hospital
        self.hospital = Hospital.objects.create(
            hosName="Teaching Hospital",
            address="Kandy Road",
            district=self.district,
            phone="+94812222222"
        )

        # Inventory
        BloodInventory.objects.create(
            hospital=self.hospital,
            blood_type="O-",
            quantity=18,
            status="available",
            collected_date=date.today(),
            expiry_date=date.today() + timedelta(days=35)
        )

        # Blood Camp
        BloodCamp.objects.create(
            title="Annual Blood Drive",
            date=date.today() + timedelta(days=10),
            start_time="08:30",
            end_time="15:30",
            location="Town Hall",
            organizer=self.admin_user,
            district=self.district
        )

    def test_admin_dashboard_stats_endpoint(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/adminDashboard/stats/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertIn("total_doctors", data)
        self.assertIn("total_hospitals", data)
        self.assertIn("total_units", data)
        self.assertIn("total_staff", data)
        self.assertIn("total_users", data)
        self.assertIn("total_donors", data)

        self.assertGreaterEqual(data["total_doctors"], 1)
        self.assertGreaterEqual(data["total_hospitals"], 1)
        self.assertGreaterEqual(data["total_units"], 18)

    def test_admin_stats_unauthorized_for_donor(self):
        self.client.force_authenticate(user=self.donor_user)
        response = self.client.get("/api/v1/adminDashboard/stats/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_donors_list(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/adminDashboard/donors/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(d["name"] == "Donor Profile" for d in response.data))

    def test_admin_camps_list(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/adminDashboard/camps/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(c["name"] == "Annual Blood Drive" for c in response.data))
