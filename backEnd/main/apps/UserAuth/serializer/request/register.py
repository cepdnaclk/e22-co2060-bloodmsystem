from django.db import IntegrityError, transaction
from rest_framework import serializers

from ...models import Profile, User


class RegisterProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "fullName",
            "nic_number",
            "phoneNumber",
            "blood_group",
            "country",
            "district",
            "hospital",
        ]
        extra_kwargs = {
            "country": {"required": False, "allow_null": True},
            "district": {"required": False, "allow_null": True},
            "hospital": {"required": False, "allow_null": True},
        }


class RegisterSerializer(serializers.ModelSerializer):
    # Use writable serializer for nested profile payload
    profile = RegisterProfileSerializer()
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "role", "password", "password2", "profile"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError("Passwords do not match.")

        # Public signup must only allow donor and bloodcamp organizer accounts.
        role = data.get("role", User.DONOR)
        if role not in [User.DONOR, User.BLOODCAMP]:
            raise serializers.ValidationError(
                {"role": "Only Donor and Blood Camp Organizer accounts can be registered publicly."}
            )

        if User.objects.filter(username=data["username"]).exists():
            raise serializers.ValidationError(
                {"username": "This username is already taken."}
            )

        if User.objects.filter(email__iexact=data["email"]).exists():
            raise serializers.ValidationError(
                {"email": "An account already exists with this email."}
            )

        profile_data = data.get("profile", {})
        nic_number = profile_data.get("nic_number")
        phone_number = profile_data.get("phoneNumber")
        country = profile_data.get("country")
        district = profile_data.get("district")
        hospital = profile_data.get("hospital")

        # validations

        if nic_number and Profile.objects.filter(nic_number=nic_number).exists():
            raise serializers.ValidationError(
                {"profile": {"nic_number": "This NIC is already registered."}}
            )

        if phone_number and Profile.objects.filter(phoneNumber=phone_number).exists():
            raise serializers.ValidationError(
                {
                    "profile": {
                        "phoneNumber": "This phone number is already registered.",
                    }
                }
            )

        if country and district and district.country_id != country.id:
            raise serializers.ValidationError(
                {
                    "profile": {
                        "district": (
                            "Selected district does not belong to selected country."
                        )
                    }
                }
            )

        if (
            hospital
            and district
            and hospital.district_id
            and hospital.district_id != district.id
        ):
            raise serializers.ValidationError(
                {
                    "profile": {
                        "hospital": (
                            "Selected hospital does not belong to selected district."
                        )
                    }
                }
            )

        if (
            hospital
            and country
            and hospital.country_id
            and hospital.country_id != country.id
        ):
            raise serializers.ValidationError(
                {
                    "profile": {
                        "hospital": (
                            "Selected hospital does not belong to selected country."
                        )
                    }
                }
            )

        return data

    def create(self, validated_data):
        profile_data = validated_data.pop("profile")
        password = validated_data.pop("password")
        validated_data.pop("password2")

        try:
            with transaction.atomic():
                user = User.objects.create_user(password=password, **validated_data)
                Profile.objects.create(user=user, **profile_data)
                return user
        except IntegrityError:
            raise serializers.ValidationError(
                "Could not create account due to duplicate or invalid profile data."
            )
