from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.UserAuth.models.hospital import Hospital
from apps.UserAuth.models.models import Profile

User = get_user_model()


class AdminDashboardIntegrationTests(APITestCase):
    """
    Integration and RBAC tests for Admin Dashboard endpoints and statistical aggregations.
    """

    def setUp(self):
        # 1. Create a regular donor user
        self.donor_user = User.objects.create_user(
            username="donorUser",
            email="donor@hopedrop.com",
            password="Password123!"
        )
        self.donor_user.role = User.DONOR
        self.donor_user.save()
        Profile.objects.create(
            user=self.donor_user,
            fullName="Regular Donor",
            nic_number="199112345678",
            blood_group="A+"
        )

        # 2. Create an admin user
        self.admin_user = User.objects.create_user(
            username="adminUser",
            email="admin@hopedrop.com",
            password="Password123!"
        )
        self.admin_user.role = User.ADMIN
        self.admin_user.is_staff = True
        self.admin_user.is_superuser = True
        self.admin_user.save()
        Profile.objects.create(
            user=self.admin_user,
            fullName="System Administrator",
            nic_number="199012345678",
            blood_group="O+"
        )

        # 3. Create a hospital
        self.hospital = Hospital.objects.create(hosName="General Hospital Colombo", address="Colombo")

    def test_admin_stats_forbidden_for_unauthenticated(self):
        """GET /api/v1/adminDashboard/stats/ must return 401 Unauthorized for anonymous users."""
        response = self.client.get("/api/v1/adminDashboard/stats/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_stats_forbidden_for_donor(self):
        """GET /api/v1/adminDashboard/stats/ must return 403 Forbidden for donors (RBAC enforcement)."""
        token = RefreshToken.for_user(self.donor_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")

        response = self.client.get("/api/v1/adminDashboard/stats/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_stats_accessible_by_admin(self):
        """GET /api/v1/adminDashboard/stats/ must return 200 OK and aggregate metrics for admin."""
        token = RefreshToken.for_user(self.admin_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")

        response = self.client.get("/api/v1/adminDashboard/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Assert all required dashboard metrics are returned
        self.assertIn("total_doctors", response.data)
        self.assertIn("total_hospitals", response.data)
        self.assertIn("total_units", response.data)
        self.assertIn("pending_requests", response.data)
        self.assertIn("approved_donations", response.data)
        self.assertIn("workflow_status_counts", response.data)
        self.assertIn("today_donated_count", response.data)

        # Confirm hospital count matches created hospital
        self.assertGreaterEqual(response.data["total_hospitals"], 1)

    def test_admin_donors_list_rbac(self):
        """GET /api/v1/adminDashboard/donors/ must forbid donors (403) and permit admins (200)."""
        # Test donor blocked
        donor_token = RefreshToken.for_user(self.donor_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(donor_token)}")
        forbidden_res = self.client.get("/api/v1/adminDashboard/donors/")
        self.assertEqual(forbidden_res.status_code, status.HTTP_403_FORBIDDEN)

        # Test admin allowed
        admin_token = RefreshToken.for_user(self.admin_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(admin_token)}")
        allowed_res = self.client.get("/api/v1/adminDashboard/donors/")
        self.assertEqual(allowed_res.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(allowed_res.data, list))
