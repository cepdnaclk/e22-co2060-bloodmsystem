from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.medicalOfficers.models.doctor import Doctor, DoctorProfile
from apps.medicalOfficers.models.hospitalStaff import StaffProfile

User = get_user_model()


class MedicalOfficersUnitTests(TestCase):
    """
    Unit tests for Doctor and StaffProfile models in isolation.
    """

    def setUp(self):
        self.doc_user = User.objects.create_user(
            username="docUnit01",
            email="docunit@hopedrop.com",
            password="DocPassword123!"
        )
        self.doc_user.role = User.DOCTOR
        self.doc_user.save()

    def test_doctor_model_creation_and_attributes(self):
        """Doctor model should store medical officer credentials and link to user."""
        doctor = Doctor.objects.create(
            user=self.doc_user,
            username=self.doc_user.username,
            email=self.doc_user.email,
            full_name="Dr. Aruni Silva",
            phone="+94771234567",
            specialization="Hematology",
            license_number="SLMC-98765",
            hospital="Kandy General Hospital"
        )
        self.assertEqual(doctor.full_name, "Dr. Aruni Silva")
        self.assertEqual(doctor.license_number, "SLMC-98765")
        self.assertEqual(doctor.specialization, "Hematology")
        self.assertTrue(doctor.is_active)
        self.assertEqual(str(doctor), "Dr. Aruni Silva")

    def test_doctor_profile_alias_compatibility(self):
        """DoctorProfile should be an alias of Doctor for backward compatibility."""
        self.assertIs(DoctorProfile, Doctor)

    def test_staff_profile_creation(self):
        """StaffProfile model should properly associate staff members with designations."""
        staff_user = User.objects.create_user(
            username="staffUnit",
            email="staff@hopedrop.com",
            password="StaffPassword123!"
        )
        staff_user.role = User.INVENTORY_OFFICER
        staff_user.save()

        staff = StaffProfile.objects.create(
            user=staff_user,
            employee_id="EMP-2026-001",
            designation="TEC",
            shift="Morning"
        )
        self.assertEqual(staff.employee_id, "EMP-2026-001")
        self.assertEqual(staff.designation, "TEC")
        self.assertEqual(staff.shift, "Morning")
from tests.test_medical_officers import MedicalOfficersTests

__all__ = ["MedicalOfficersTests"]
