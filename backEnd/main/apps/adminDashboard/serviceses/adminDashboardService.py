from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.UserAuth.models.models import User
from apps.donor.models.bloodCamp import BloodCamp
from apps.donor.models.donorDetails import DonorDetails
from apps.donor.models.campRegistration import CampRegistration
from apps.UserAuth.models.hospital import Hospital
from apps.blood.bloodinventor.models.bloodinventor import BloodInventory
from apps.blood.bloodinventor.models.bloodRequest import BloodRequest
from apps.donor.models.donationHistory import DonationHistory
from apps.medicalOfficers.models.hospitalStaff import StaffProfile

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_dashboard_stats(request):
    if request.user.role != User.ADMIN:
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
    
    total_doctors = User.objects.filter(role=User.DOCTOR).count()
    total_hospitals = Hospital.objects.count()
    total_units_agg = BloodInventory.objects.filter(status="available").aggregate(total=Sum('quantity'))
    total_units = total_units_agg['total'] or 0
    pending_requests = BloodRequest.objects.filter(status=BloodRequest.Status.PENDING).count()
    approved_donations = DonationHistory.objects.filter(status="completed").count()
    workflow_counts_qs = CampRegistration.objects.values("status").annotate(count=Count("id"))
    workflow_status_counts = {row["status"]: row["count"] for row in workflow_counts_qs}
    today = timezone.now().date()
    today_donated_count = CampRegistration.objects.filter(status="donated", collected_at__date=today).count()
    rejection_reasons = (
        CampRegistration.objects.filter(status="rejected")
        .exclude(rejection_reason="")
        .values("rejection_reason")
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )

    total_staff = StaffProfile.objects.count()
    total_donors = User.objects.filter(role=User.DONOR).count()
    total_users = User.objects.count()

    return Response({
        "total_staff": total_staff,
        "total_doctors": total_doctors,
        "total_donors": total_donors,
        "total_users": total_users,
        "total_hospitals": total_hospitals,
        "total_units": total_units,
        "total_inventory_units": total_units,
        "pending_requests": pending_requests,
        "approved_donations": approved_donations,
        "workflow_status_counts": workflow_status_counts,
        "today_donated_count": today_donated_count,
        "rejection_reason_summary": list(rejection_reasons),
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_donors(request):
    if request.user.role != User.ADMIN:
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
    donors = User.objects.filter(role=User.DONOR).select_related('profile')
    data = []
    for d in donors:
        last_donation = None
        try:
            details = DonorDetails.objects.get(user=d)
            if details.last_donation_date:
                last_donation = details.last_donation_date.isoformat()
        except DonorDetails.DoesNotExist:
            pass
            
        data.append({
            "id": d.id,
            "name": d.profile.fullName if hasattr(d, 'profile') else d.username,
            "bloodGroup": d.profile.blood_group if hasattr(d, 'profile') else 'Unknown',
            "contact": str(d.profile.phoneNumber) if hasattr(d, 'profile') and d.profile.phoneNumber else 'N/A',
            "lastDonation": last_donation or 'Never',
            "status": "Active" if d.is_active else "Inactive"
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_camps(request):
    if request.user.role != User.ADMIN:
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
    camps = BloodCamp.objects.all().select_related('organizer')
    data = []
    for c in camps:
        data.append({
            "id": c.id,
            "name": c.title,
            "organizer": c.organizer.username if c.organizer else 'Unknown',
            "date": c.date.isoformat() if c.date else None,
            "location": c.location,
            "expectedDonors": 0
        })
    return Response(data)
