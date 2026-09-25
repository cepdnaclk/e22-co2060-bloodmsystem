from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.UserAuth.models.hospital import Hospital
from apps.UserAuth.models.location import Country, District
from apps.medicalOfficers.models.doctor import Doctor
from apps.medicalOfficers.models.hospitalStaff import StaffProfile

User = get_user_model()


class MedicalOfficersTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(countryName="Sri Lanka", countryCode="LK")
        self.district = District.objects.create(districtName="Colombo", country=self.country)
        self.hospital = Hospital.objects.create(
            hosName="National Hospital of Sri Lanka",
            address="Colombo 08",
            district=self.district,
            phone="+94112691111"
        )

        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@hospital.lk",
            password="AdminPassword123!",
            role=User.ADMIN
        )

        self.doctor = Doctor.objects.create(
            name="Dr. Sarah Connor",
            email="sarah.connor@hospital.lk",
            phone="+94771122334",
            nic="198512345678",
            specialization="Hematology",
            hospital=self.hospital,
            status="active"
        )

        self.staff_user = User.objects.create_user(
            username="staff01",
            email="staff@hospital.lk",
            password="StaffPassword123!",
            role=User.INVENTORY_OFFICER
        )
        self.staff = StaffProfile.objects.create(
            user=self.staff_user,
            employee_id="STF001",
            designation="TEC",
            branch_location="National Hospital Blood Bank",
            shift="Morning"
        )

    def test_doctor_list_admin_access(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/adminDashboard/doctors/list/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        doctors = response.data if isinstance(response.data, list) else response.data.get("results", [])
        self.assertTrue(any(d["name"] == "Dr. Sarah Connor" for d in doctors))

    def test_doctor_stats(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/adminDashboard/doctor/total/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_staff_list_and_total(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/adminDashboard/staff/list/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        total_response = self.client.get("/api/v1/adminDashboard/staff/total/")
        self.assertEqual(total_response.status_code, status.HTTP_200_OK)
