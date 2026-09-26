from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from apps.UserAuth.models.models import nic_validator, Profile
from apps.UserAuth.serializer.request.register import RegisterSerializer

User = get_user_model()


class UserAuthUnitTests(APITestCase):
    """
    Unit tests for UserAuth models, validators, and serializers in isolation.
    """

    def test_nic_validator_valid_formats(self):
        """NIC validator should accept standard 12-digit and 9-digit+V/X formats."""
        valid_nics = [
            "200213500619",  # Modern 12-digit format
            "199812345678",  # Modern 12-digit format
            "981234567V",   # Old 9-digit with uppercase V
            "981234567v",   # Old 9-digit with lowercase v
            "981234567X",   # Old 9-digit with uppercase X
            "981234567x",   # Old 9-digit with lowercase x
        ]
        for nic in valid_nics:
            try:
                nic_validator(nic)
            except ValidationError:
                self.fail(f"nic_validator raised ValidationError unexpectedly for valid NIC: {nic}")

    def test_nic_validator_invalid_formats(self):
        """NIC validator should reject invalid lengths, special characters, and wrong placements."""
        invalid_nics = [
            "12345",          # Too short
            "1234567890123",  # Too long (13 digits)
            "98123456V8",     # Letter not at the end
            "981234567A",     # Letter other than V/X
            "200213500619V",  # 12 digits with trailing letter
            "abcdefghijkl",   # Alphabetic string
            "",               # Empty string
        ]
        for nic in invalid_nics:
            with self.assertRaises(ValidationError, msg=f"Expected ValidationError for NIC: {nic}"):
                nic_validator(nic)

    def test_user_creation_defaults(self):
        """User model should correctly set default role to 'donor' and use email as username field."""
        user = User.objects.create_user(
            username="unitTest01",
            email="unittest01@example.com",
            password="SecurePassword123!"
        )
        self.assertEqual(user.role, User.DONOR)
        self.assertTrue(user.check_password("SecurePassword123!"))
        self.assertEqual(str(user), "unitTest01")

    def test_register_serializer_rejects_mismatched_passwords(self):
        """RegisterSerializer should validate that password and password2 match."""
        payload = {
            "username": "mismatch",  # <= 10 characters
            "email": "mismatch@example.com",
            "role": "donor",
            "password": "Password123!",
            "password2": "DifferentPassword123!",
            "profile": {
                "fullName": "Test User",
                "nic_number": "199912345678",
                "blood_group": "O+"
            }
        }
        serializer = RegisterSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_register_serializer_rejects_unauthorized_public_roles(self):
        """RegisterSerializer should reject public registration for admin, doctor, and inventory roles."""
        role_map = [
            (User.ADMIN, "u_admin"),
            (User.DOCTOR, "u_doc"),
            (User.INVENTORY_OFFICER, "u_inv"),
        ]
        for role, short_uname in role_map:
            payload = {
                "username": short_uname,  # max 10 chars
                "email": f"{short_uname}@test.com",
                "role": role,
                "password": "Password123!",
                "password2": "Password123!",
                "profile": {
                    "fullName": "Test User",
                    "nic_number": "199912345679",
                    "blood_group": "A+"
                }
            }
            serializer = RegisterSerializer(data=payload)
            self.assertFalse(serializer.is_valid(), f"Serializer should reject role '{role}' for public signup")
            self.assertIn("role", serializer.errors)


class UserAuthIntegrationTests(APITestCase):
    """
    Integration tests for UserAuth API endpoints, JWT token lifecycle, and session handling.
    """

    def setUp(self):
        self.register_url = "/api/v1/auth/register/"
        self.token_url = "/api/v1/auth/token/"
        self.refresh_url = "/api/v1/auth/token/refresh/"
        self.logout_url = "/api/v1/auth/logout/"
        self.profile_url = "/api/v1/auth/profile/"

        # Pre-create a donor user for auth tests
        self.donor_user = User.objects.create_user(
            username="donorTest",
            email="donortest@hopedrop.com",
            password="DonorTestPass123!"
        )
        self.donor_user.role = User.DONOR
        self.donor_user.save()
        Profile.objects.create(
            user=self.donor_user,
            fullName="Jane Test Doe",
            nic_number="199512345678",
            blood_group="O+"
        )

    def test_donor_registration_success(self):
        """POST /api/v1/auth/register/ should successfully create a donor and return JWT tokens."""
        payload = {
            "username": "newDonor",
            "email": "newdonor@hopedrop.com",
            "role": "donor",
            "password": "NewDonorPass123!",
            "password2": "NewDonorPass123!",
            "profile": {
                "fullName": "New Donor Person",
                "nic_number": "199712345678",
                "blood_group": "B+"
            }
        }
        response = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["email"], "newdonor@hopedrop.com")
        self.assertEqual(response.data["user"]["role"], "donor")

    def test_login_success_with_valid_credentials(self):
        """POST /api/v1/auth/token/ should return JWT token pair encoding user claims."""
        response = self.client.post(
            self.token_url,
            {"email": "donortest@hopedrop.com", "password": "DonorTestPass123!"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        # Verify decoded access token contains the user's role and user_id claim
        token = AccessToken(response.data["access"])
        self.assertEqual(token.get("role"), "donor")
        self.assertEqual(token.get("user_id"), str(self.donor_user.id))

    def test_login_fails_with_invalid_password(self):
        """POST /api/v1/auth/token/ should return 401 Unauthorized for incorrect password."""
        response = self.client.post(
            self.token_url,
            {"email": "donortest@hopedrop.com", "password": "WrongPassword999!"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh_workflow(self):
        """POST /api/v1/auth/token/refresh/ should return a new access token when provided a valid refresh token."""
        refresh = RefreshToken.for_user(self.donor_user)
        response = self.client.post(
            self.refresh_url,
            {"refresh": str(refresh)},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_logout_blacklists_refresh_token(self):
        """POST /api/v1/auth/logout/ should blacklist the refresh token to prevent reuse."""
        refresh = RefreshToken.for_user(self.donor_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

        # Perform logout
        logout_response = self.client.post(
            self.logout_url,
            {"refresh": str(refresh)},
            format="json"
        )
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        # Attempt to use the blacklisted refresh token - must be rejected
        refresh_response = self.client.post(
            self.refresh_url,
            {"refresh": str(refresh)},
            format="json"
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_endpoint_requires_authentication(self):
        """GET /api/v1/auth/profile/ should return 401 without auth, and 200 with valid JWT."""
        # Unauthenticated request
        unauth_response = self.client.get(self.profile_url)
        self.assertEqual(unauth_response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated request
        token = RefreshToken.for_user(self.donor_user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        auth_response = self.client.get(self.profile_url)
        self.assertEqual(auth_response.status_code, status.HTTP_200_OK)
        self.assertEqual(auth_response.data["user"]["email"], "donortest@hopedrop.com")
        self.assertEqual(auth_response.data["profile"]["fullName"], "Jane Test Doe")
