from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.UserAuth.models.hospital import Hospital
from apps.UserAuth.models.location import Country, District
from apps.blood.bloodinventor.models.bloodinventor import BloodInventory
from apps.blood.bloodinventor.models.expiryAlert import ExpiryAlert

User = get_user_model()


class BloodInventoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(countryName="Sri Lanka", countryCode="LK")
        self.district = District.objects.create(districtName="Colombo", country=self.country)
        self.hospital = Hospital.objects.create(
            hosName="General Hospital Colombo",
            address="Regent Street, Colombo",
            district=self.district,
            phone="+94112691111"
        )

        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="AdminPassword123!",
            role=User.ADMIN
        )

        # Seed inventory
        self.inv1 = BloodInventory.objects.create(
            hospital=self.hospital,
            blood_type="A+",
            quantity=25,
            status="available",
            collected_date=date.today() - timedelta(days=5),
            expiry_date=date.today() + timedelta(days=30),
            source_type="camp"
        )
        self.inv2 = BloodInventory.objects.create(
            hospital=self.hospital,
            blood_type="O+",
            quantity=5,
            status="available",
            collected_date=date.today() - timedelta(days=2),
            expiry_date=date.today() + timedelta(days=33),
            source_type="hospital"
        )

    def test_live_stock_api_structure_and_counts(self):
        response = self.client.get("/api/v1/blood/live-stock/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()

        self.assertIn("updatedAt", payload)
        self.assertIn("stocks", payload)
        self.assertEqual(len(payload["stocks"]), 8)

        # Check A+ units
        a_pos = next((s for s in payload["stocks"] if s["bloodType"] == "A+"), None)
        self.assertIsNotNone(a_pos)
        self.assertEqual(a_pos["units"], 25)
        self.assertEqual(a_pos["status"], "Low")

        # Check O+ units (5 units -> Critical)
        o_pos = next((s for s in payload["stocks"] if s["bloodType"] == "O+"), None)
        self.assertIsNotNone(o_pos)
        self.assertEqual(o_pos["units"], 5)
        self.assertEqual(o_pos["status"], "Critical")

    def test_inventory_alias_endpoint(self):
        response = self.client.get("/api/v1/blood/inventory/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("stocks", response.json())

    def test_hospitals_stock_summary(self):
        response = self.client.get("/api/v1/blood/hospitals/stock/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        hospitals_data = response.json()
        self.assertTrue(any(h.get("name") == "General Hospital Colombo" for h in hospitals_data))

    def test_expiry_alerts_admin_access(self):
        # Create an alert
        ExpiryAlert.objects.create(
            hospital=self.hospital,
            blood_inventory=self.inv1,
            alert_type="expiring_soon",
            is_resolved=False
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/blood/expiry/alerts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
