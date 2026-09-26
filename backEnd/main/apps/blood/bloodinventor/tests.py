from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.UserAuth.models.hospital import Hospital
from apps.UserAuth.models.location import Country, District
from apps.blood.bloodinventor.models.bloodBank import BloodBank
from apps.blood.bloodinventor.models.bloodinventor import BloodInventory
from apps.blood.bloodinventor.services.hospital.hospital_stock_service import (
    _get_stock_status,
    _build_blood_type_summary,
    BLOOD_TYPES
)

User = get_user_model()


class BloodInventoryUnitTests(TestCase):
    """
    Unit tests for Blood Inventory calculations, status logic, and model methods.
    """

    def test_stock_status_thresholds(self):
        """_get_stock_status should classify units according to NBTS thresholds."""
        # Critical (< 10)
        self.assertEqual(_get_stock_status(0), "Critical")
        self.assertEqual(_get_stock_status(9), "Critical")

        # Low (< 30)
        self.assertEqual(_get_stock_status(10), "Low")
        self.assertEqual(_get_stock_status(29), "Low")

        # Normal (>= 30)
        self.assertEqual(_get_stock_status(30), "Normal")
        self.assertEqual(_get_stock_status(150), "Normal")

    def test_blood_types_list_completeness(self):
        """System should account for all 8 standard ABO/Rh blood groups."""
        expected = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        self.assertEqual(sorted(BLOOD_TYPES), sorted(expected))

    def test_build_blood_type_summary_aggregation(self):
        """_build_blood_type_summary should correctly aggregate available and non-expired units."""
        today = timezone.localdate()
        country = Country.objects.create(countryName="Sri Lanka")
        district = District.objects.create(districtName="Colombo", country=country)
        hospital = Hospital.objects.create(hosName="Test General Hospital", address="Colombo", district=district, country=country)
        blood_bank = BloodBank.objects.create(
            bloodBankName="Test Bank",
            district=district,
            country=country,
            hospital=hospital
        )

        # Create available units for A+ and O-
        BloodInventory.objects.create(
            blood_type="A+",
            quantity=25,
            blood_bank=blood_bank,
            hospital=hospital,
            collected_date=today - timedelta(days=2),
            expiry_date=today + timedelta(days=30),
            status="available"
        )
        BloodInventory.objects.create(
            blood_type="O-",
            quantity=8,
            blood_bank=blood_bank,
            hospital=hospital,
            collected_date=today - timedelta(days=5),
            expiry_date=today + timedelta(days=25),
            status="available"
        )
        # Create expired units for A+ (should be excluded)
        BloodInventory.objects.create(
            blood_type="A+",
            quantity=50,
            blood_bank=blood_bank,
            hospital=hospital,
            collected_date=today - timedelta(days=45),
            expiry_date=today - timedelta(days=5),
            status="available"
        )

        qs = BloodInventory.objects.filter(hospital=hospital)
        summary = _build_blood_type_summary(qs)

        self.assertEqual(len(summary), 8)
        summary_dict = {item["bloodType"]: item for item in summary}

        # A+ should only have 25 active units (Low status)
        self.assertEqual(summary_dict["A+"]["units"], 25)
        self.assertEqual(summary_dict["A+"]["status"], "Low")

        # O- should have 8 units (Critical status)
        self.assertEqual(summary_dict["O-"]["units"], 8)
        self.assertEqual(summary_dict["O-"]["status"], "Critical")

        # B+ has 0 units (Critical status)
        self.assertEqual(summary_dict["B+"]["units"], 0)
        self.assertEqual(summary_dict["B+"]["status"], "Critical")


class BloodInventoryIntegrationTests(APITestCase):
    """
    Integration tests for live stock APIs and Role-Based Access Control on inventory views.
    """

    def setUp(self):
        self.today = timezone.localdate()
        self.country = Country.objects.create(countryName="Sri Lanka")
        self.district = District.objects.create(districtName="Kandy", country=self.country)
        self.hospital = Hospital.objects.create(
            hosName="National Hospital",
            address="Kandy",
            district=self.district,
            country=self.country
        )
        self.blood_bank = BloodBank.objects.create(
            bloodBankName="Central Blood Bank",
            district=self.district,
            country=self.country,
            hospital=self.hospital
        )

        # Seed sample blood units
        BloodInventory.objects.create(
            blood_type="O+",
            quantity=45,
            blood_bank=self.blood_bank,
            hospital=self.hospital,
            collected_date=self.today - timedelta(days=3),
            expiry_date=self.today + timedelta(days=32),
            status="available"
        )

        # Create a regular donor user
        self.donor_user = User.objects.create_user(
            username="donorUser",
            email="donor@hopedrop.com",
            password="Password123!"
        )
        self.donor_user.role = User.DONOR
        self.donor_user.save()

        # Create an admin user
        self.admin_user = User.objects.create_user(
            username="adminUser",
            email="admin@hopedrop.com",
            password="Password123!"
        )
        self.admin_user.role = User.ADMIN
        self.admin_user.is_staff = True
        self.admin_user.is_superuser = True
        self.admin_user.save()

    def test_public_live_stock_api_structure(self):
        """GET /api/v1/blood/live-stock/ should return 200 and all 8 blood types with status."""
        response = self.client.get("/api/v1/blood/live-stock/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()

        self.assertIn("updatedAt", payload)
        self.assertIn("stocks", payload)
        self.assertEqual(len(payload["stocks"]), 8)

        # Verify O+ shows up with 45 units and Normal status
        o_plus = next(item for item in payload["stocks"] if item["bloodType"] == "O+")
        self.assertEqual(o_plus["units"], 45)
        self.assertEqual(o_plus["status"], "Normal")

    def test_national_live_stock_public_access(self):
        """GET /api/v1/blood/national/live/ should be accessible without authentication."""
        response = self.client.get("/api/v1/blood/national/live/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("stocks", response.data)
        self.assertEqual(len(response.data["stocks"]), 8)

    def test_single_hospital_stock_public_access(self):
        """GET /api/v1/blood/hospital/<id>/stock/ should return stock for a specific hospital."""
        url = f"/api/v1/blood/hospital/{self.hospital.id}/stock/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 8)

    def test_national_dashboard_rbac_forbidden_for_donor(self):
        """GET /api/v1/blood/national/dashboard/ must return 403 Forbidden for a regular donor."""
        token = RefreshToken.for_user(self.donor_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")

        response = self.client.get("/api/v1/blood/national/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_national_dashboard_rbac_allowed_for_admin(self):
        """GET /api/v1/blood/national/dashboard/ must return 200 OK for an administrator."""
        token = RefreshToken.for_user(self.admin_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")

        response = self.client.get("/api/v1/blood/national/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("totalUnits", response.data)
        self.assertIn("totalHospitals", response.data)
        self.assertIn("nationalStock", response.data)
        self.assertIn("alertSummary", response.data)
        self.assertEqual(response.data["totalUnits"], 45)
from tests.test_blood_inventory import BloodInventoryTests

__all__ = ["BloodInventoryTests"]
