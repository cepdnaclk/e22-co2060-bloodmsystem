from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.UserAuth.models import Profile
from apps.UserAuth.models.location import Country, District
from apps.UserAuth.models.hospital import Hospital

User = get_user_model()


class UserAuthModelTests(TestCase):
    def setUp(self):
        self.country = Country.objects.create(countryName="Sri Lanka", countryCode="LK")
        self.district = District.objects.create(districtName="Colombo", country=self.country)
        self.hospital = Hospital.objects.create(
            hosName="National Hospital",
            address="Colombo 08",
            district=self.district,
            phone="+94112691111"
        )

    def test_create_donor_user_with_profile(self):
        user = User.objects.create_user(
            username="donor01",
            email="donor01@example.com",
            password="StrongPassword123!",
            role=User.DONOR
        )
        profile = Profile.objects.create(
            user=user,
            fullName="John Doe",
            nic_number="200012345678",
            blood_group="O+",
            phoneNumber="+94771234567",
            country=self.country,
            district=self.district,
            hospital=self.hospital
        )

        self.assertEqual(user.role, User.DONOR)
        self.assertEqual(profile.fullName, "John Doe")
        self.assertEqual(profile.blood_group, "O+")
        self.assertEqual(str(user), "donor01")
        self.assertEqual(str(profile), "John Doe")

    def test_nic_validation_rules(self):
        user = User.objects.create_user(
            username="nicuser",
            email="nicuser@example.com",
            password="StrongPassword123!"
        )
        invalid_profile = Profile(
            user=user,
            fullName="Invalid NIC",
            nic_number="12345",  # Invalid length
            blood_group="A+"
        )
        with self.assertRaises(ValidationError):
            invalid_profile.full_clean()


class UserAuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(countryName="Sri Lanka", countryCode="LK")
        self.district = District.objects.create(districtName="Kandy", country=self.country)

        self.existing_user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="Password123!",
            role=User.DONOR
        )
        self.existing_profile = Profile.objects.create(
            user=self.existing_user,
            fullName="Test User",
            nic_number="199512345678",
            blood_group="B+",
            country=self.country,
            district=self.district
        )

    def test_login_successful_jwt(self):
        response = self.client.post("/api/v1/auth/token/", {
            "email": "testuser@example.com",
            "password": "Password123!"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "testuser@example.com")
        self.assertEqual(response.data["user"]["role"], User.DONOR)

    def test_login_invalid_credentials(self):
        response = self.client.post("/api/v1/auth/token/", {
            "email": "testuser@example.com",
            "password": "WrongPassword!"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        refresh = RefreshToken.for_user(self.existing_user)
        response = self.client.post("/api/v1/auth/token/refresh/", {
            "refresh": str(refresh)
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_protected_profile_unauthorized(self):
        response = self.client.get("/api/v1/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_profile_authorized(self):
        self.client.force_authenticate(user=self.existing_user)
        response = self.client.get("/api/v1/auth/profile/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("email") or response.data.get("username"), self.existing_user.username)
