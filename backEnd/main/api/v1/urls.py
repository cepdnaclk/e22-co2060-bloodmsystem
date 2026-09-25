from django.urls import include, path

urlpatterns = [
    path("auth/", include("apps.UserAuth.urls")),
    #public live stock
    path("blood/", include("apps.blood.bloodinventor.urls")),
    path("inventory/", include("apps.blood.bloodinventor.urls")),
    #adminDashboard control medical officers
    path('medicalOfficers/',include("apps.medicalOfficers.urls")),
    path("adminDashboard/",include("apps.adminDashboard.urls")),
    path("donor/", include("apps.donor.urls.urls")),
]
