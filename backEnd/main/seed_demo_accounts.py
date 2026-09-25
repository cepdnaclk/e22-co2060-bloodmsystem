import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.UserAuth.models import Profile
from apps.medicalOfficers.models.doctor import Doctor
from apps.donor.models.donorDetails import DonorDetails

User = get_user_model()

ACCOUNTS = [
    {
        "role": "admin",
        "username": "adminUser",
        "email": "admin@hopedrop.com",
        "password": "AdminPassword123!",
        "full_name": "System Administrator",
        "nic": "199012345678",
        "blood_group": "O+",
        "dashboard": "/admin"
    },
    {
        "role": "doctor",
        "username": "docHouse",
        "email": "doctor@hopedrop.com",
        "password": "DoctorPassword123!",
        "full_name": "Dr. Gregory House",
        "nic": "198512345678",
        "blood_group": "A+",
        "dashboard": "/doctor",
        "specialization": "Hematologist",
        "license": "SLMC-98765",
        "hospital": "National Blood Center"
    },
    {
        "role": "donor",
        "username": "donorJane",
        "email": "donor@hopedrop.com",
        "password": "DonorPassword123!",
        "full_name": "Jane Doe",
        "nic": "199812345678",
        "blood_group": "O+",
        "dashboard": "/donor"
    },
    {
        "role": "bloodcamp",
        "username": "campOrg",
        "email": "camp@hopedrop.com",
        "password": "CampPassword123!",
        "full_name": "Red Cross Kandy Organizer",
        "nic": "199212345678",
        "blood_group": "B+",
        "dashboard": "/bloodcamp"
    },
    {
        "role": "Inventor",
        "username": "invOfficer",
        "email": "inventory@hopedrop.com",
        "password": "InventoryPassword123!",
        "full_name": "Chief Inventory Officer",
        "nic": "198812345678",
        "blood_group": "AB+",
        "dashboard": "/inventory"
    }
]

def seed_accounts():
    print("--- Seeding Demo Accounts for All Roles ---")
    credentials_output = ["=== HOPEDROP DEMO TEST CREDENTIALS ===", "Use these credentials to log in at http://localhost:5173/login\n"]
    
    for acc in ACCOUNTS:
        user = User.objects.filter(email=acc["email"]).first()
        if not user:
            user = User.objects.filter(username=acc["username"]).first()
            
        if not user:
            user = User.objects.create_user(
                username=acc["username"],
                email=acc["email"],
                password=acc["password"]
            )
            print(f"[+] Created User: {acc['email']} ({acc['role']})")
        else:
            user.set_password(acc["password"])
            print(f"[~] Updated existing User: {acc['email']}")

        user.role = acc["role"]
        if acc["role"] in ["admin", "adminDashboard"]:
            user.is_staff = True
            user.is_superuser = True
        user.save()

        # Profile
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.fullName = acc["full_name"]
        profile.nic_number = acc["nic"]
        profile.blood_group = acc["blood_group"]
        profile.save()

        # Role-specific records
        if acc["role"] == "doctor":
            doc, _ = Doctor.objects.get_or_create(email=acc["email"])
            doc.user = user
            doc.username = acc["username"]
            doc.full_name = acc["full_name"]
            doc.phone = "+94771234567"
            doc.specialization = acc["specialization"]
            doc.license_number = acc["license"]
            doc.hospital = acc["hospital"]
            doc.is_active = True
            doc.credentials_created = True
            doc.save()

        elif acc["role"] == "donor":
            DonorDetails.objects.get_or_create(user=user)

        credentials_output.append(f"Role: {acc['role'].upper()}")
        credentials_output.append(f"  Email:     {acc['email']}")
        credentials_output.append(f"  Password:  {acc['password']}")
        credentials_output.append(f"  Dashboard: http://localhost:5173{acc['dashboard']}\n")

    # Also keep the existing adminDashboard
    admin_dash = User.objects.filter(email="adminDashboard@hopedrop.com").first()
    if admin_dash:
        credentials_output.append("Role: ADMIN (Primary)")
        credentials_output.append("  Email:     adminDashboard@hopedrop.com")
        credentials_output.append("  Password:  AdminPassword123!")
        credentials_output.append("  Dashboard: http://localhost:5173/admin\n")

    # Write to test_credentials.txt in repo root
    root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    cred_file = os.path.join(root_path, "test_credentials.txt")
    with open(cred_file, "w", encoding="utf-8") as f:
        f.write("\n".join(credentials_output))

    print(f"\n[OK] All demo accounts ready! Saved credentials to: {cred_file}")

if __name__ == '__main__':
    seed_accounts()
