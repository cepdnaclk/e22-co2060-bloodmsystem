import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LayoutDashboard,
  User,
  Settings,
  Droplet,
  History,
  Calendar,
  Phone,
  Hospital,
  IdCard,
  Edit2,
  Camera,
  QrCode,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Bell,
  MapPin,
  Search,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getDonorProfile,
  updateDonorProfile,
  getDonorDashboard,
  getDonorDonations,
} from "../../services/donorService";
import { getDonorAlerts, markAlertRead } from "../../services/alertService";
import { getUpcomingCamps, registerForCamp } from "../../services/campService";
import { QRCodeCanvas } from "qrcode.react";
import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import "./DonorDashboard.css";

const DONOR_TABS = {
  DASHBOARD: "dashboard",
  HISTORY: "history",
  CAMPS: "camps",
  PROFILE: "profile",
  SETTINGS: "settings",
};

const MENU_ITEMS = [
  {
    id: DONOR_TABS.DASHBOARD,
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
  },
  {
    id: DONOR_TABS.HISTORY,
    icon: <History size={20} />,
    label: "Donation History",
  },
  {
    id: DONOR_TABS.CAMPS,
    icon: <Calendar size={20} />,
    label: "Upcoming Camps",
  },
  {
    id: DONOR_TABS.PROFILE,
    icon: <User size={20} />,
    label: "My Profile",
  },
  {
    id: DONOR_TABS.SETTINGS,
    icon: <Settings size={20} />,
    label: "Settings",
  },
];

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]
  );

const DonorDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState(DONOR_TABS.DASHBOARD);
  const [profile, setProfile] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [upcomingCamps, setUpcomingCamps] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // History state
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsMeta, setDonationsMeta] = useState({
    next: null,
    previous: null,
    count: 0,
    currentPage: 1,
  });
  const [historyFilter, setHistoryFilter] = useState("");

  // Camps state
  const [campSearch, setCampSearch] = useState("");
  const [registeringCampId, setRegisteringCampId] = useState(null);

  // Profile Edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    phoneNumber: "",
    hospital: "",
    profile_image: null,
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Settings state
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Data fetching
  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [profileData, statsData, alertsData, campsData] = await Promise.all([
        getDonorProfile(),
        getDonorDashboard(),
        getDonorAlerts(),
        getUpcomingCamps(),
      ]);

      setProfile(profileData);
      setDashboardStats(statsData);
      setAlerts(Array.isArray(alertsData) ? alertsData : alertsData?.results || []);

      const newCamps = Array.isArray(campsData) ? campsData : campsData?.results || [];
      setUpcomingCamps((prevCamps) => {
        if (!prevCamps || prevCamps.length === 0) return newCamps;
        return newCamps.map((camp) => {
          const prevCamp = prevCamps.find((pc) => pc.id === camp.id);
          return {
            ...camp,
            is_registered:
              camp.is_registered || (prevCamp ? prevCamp.is_registered : false),
          };
        });
      });
    } catch (err) {
      console.error("Fetch error in DonorDashboard:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchDonations = useCallback(
    async (page = 1, status = historyFilter) => {
      setDonationsLoading(true);
      try {
        const params = { page };
        if (status) params.status = status;
        const data = await getDonorDonations(params);
        setDonations(data.results || []);
        setDonationsMeta({
          next: data.next,
          previous: data.previous,
          count: data.count || 0,
          currentPage: page,
        });
      } catch (err) {
        console.error("Error fetching donor donations:", err);
        setDonations([]);
      } finally {
        setDonationsLoading(false);
      }
    },
    [historyFilter]
  );

  useEffect(() => {
    fetchData();

    // 10s Live polling for real-time dashboard sync
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === DONOR_TABS.HISTORY) {
      fetchDonations(1, historyFilter);
    }
  }, [activeTab, fetchDonations, historyFilter]);

  // Derived Values
  const isEligible = dashboardStats?.is_eligible ?? true;
  const nextEligible = dashboardStats?.next_eligible
    ? new Date(dashboardStats.next_eligible).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Eligible Now";

  const isAvailable = dashboardStats?.is_available ?? profile?.is_available ?? true;
  const unreadAlerts = alerts.filter((a) => !a.is_read);
  const unreadCount = unreadAlerts.length;

  const displayName = profile?.fullName || "Valued Donor";
  const displayHospital = profile?.hospital || "National Blood Center";

  // Action Handlers
  const handleToggleAvailability = async () => {
    if (!profile || !isEligible) return;

    const newStatus = !isAvailable;
    // Optimistic update
    setProfile((prev) => ({ ...prev, is_available: newStatus }));
    setDashboardStats((prev) => ({ ...prev, is_available: newStatus }));

    try {
      await updateDonorProfile({ is_available: newStatus });
      Swal.fire({
        icon: "success",
        title: `Status: ${newStatus ? "Available for Urgent Needs" : "Marked Unavailable"}`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
      });
    } catch {
      // Revert on error
      setProfile((prev) => ({ ...prev, is_available: !newStatus }));
      setDashboardStats((prev) => ({ ...prev, is_available: !newStatus }));
      Swal.fire({ icon: "error", title: "Failed to update availability status." });
    }
  };

  const handleRegisterCamp = async (campId) => {
    if (!isEligible) {
      Swal.fire(
        "Resting Period Active",
        `You will be eligible to donate again on ${nextEligible}. Thank you for your commitment!`,
        "warning"
      );
      return;
    }

    try {
      setRegisteringCampId(campId);
      await registerForCamp(campId);
      Swal.fire({
        icon: "success",
        title: "Registration Confirmed!",
        text: "You have been registered for this donation drive. Present your QR pass on arrival.",
      });

      setUpcomingCamps((prev) =>
        prev.map((c) => (c.id === campId ? { ...c, is_registered: true } : c))
      );
    } catch (err) {
      const msg = err.response?.data?.detail || "Registration could not be completed.";
      Swal.fire("Registration Failed", msg, "error");
    } finally {
      setRegisteringCampId(null);
    }
  };

  const handleOpenNotifications = async () => {
    if (!alerts || alerts.length === 0) {
      Swal.fire({
        title: "Notifications",
        text: "You have no notifications at this time.",
        icon: "info",
      });
      return;
    }

    const html = `
      <div style="text-align: left; max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 4px;">
        ${alerts
          .slice(0, 10)
          .map(
            (a) => `
          <div style="padding: 12px; border-radius: 8px; border: 1px solid var(--color-border); background: ${
            a.is_read ? "transparent" : "var(--color-secondary-light)"
          };">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="color: var(--color-text-main); font-size: 0.85rem; text-transform: uppercase;">${escapeHtml(
                a.alert_type || "Alert"
              )}</strong>
              <small style="color: var(--color-text-muted); font-size: 0.75rem;">${escapeHtml(
                new Date(a.created_at).toLocaleString()
              )}</small>
            </div>
            <p style="margin: 0; color: var(--color-text-main); font-size: 0.875rem;">${escapeHtml(
              a.message
            )}</p>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    const result = await Swal.fire({
      title: `Notifications (${unreadCount} unread)`,
      html,
      width: 620,
      showCancelButton: true,
      cancelButtonText: "Close",
      confirmButtonText: unreadCount > 0 ? "Mark All as Read" : "View Full Alerts Page",
      confirmButtonColor: "var(--color-primary)",
    });

    if (result.isConfirmed) {
      if (unreadCount > 0) {
        await Promise.allSettled(unreadAlerts.map((a) => markAlertRead(a.id)));
        await fetchData(true);
      } else {
        navigate("/donor/notifications");
      }
    }
  };

  // Profile Edit Handlers
  const handleStartEditProfile = () => {
    setEditFormData({
      phoneNumber: profile?.phoneNumber || "",
      hospital: profile?.hospital || "",
      profile_image: null,
    });
    setAvatarPreview(profile?.profile_image || "");
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setEditFormData({ phoneNumber: "", hospital: "", profile_image: null });
    setAvatarPreview("");
  };

  const handleAvatarFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditFormData((prev) => ({ ...prev, profile_image: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateDonorProfile(editFormData);
      Swal.fire({
        icon: "success",
        title: "Profile Updated",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
      });
      await fetchData(true);
      setIsEditingProfile(false);
    } catch (err) {
      const errorMsg = err.response?.data
        ? JSON.stringify(err.response.data)
        : "Failed to update profile.";
      Swal.fire({ icon: "error", title: "Update Failed", text: errorMsg });
    } finally {
      setProfileSaving(false);
    }
  };

  // Filtered Camps
  const filteredCamps = useMemo(() => {
    if (!campSearch.trim()) return upcomingCamps;
    const q = campSearch.toLowerCase();
    return upcomingCamps.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [upcomingCamps, campSearch]);

  // Header Actions
  const headerActions = (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <button
        type="button"
        onClick={isEligible ? handleToggleAvailability : null}
        disabled={!isEligible}
        className={`dashboard btn ${isAvailable ? "btn-primary" : "btn-outline"}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          fontSize: "0.85rem",
          cursor: isEligible ? "pointer" : "not-allowed",
          opacity: isEligible ? 1 : 0.65,
        }}
        title={
          isEligible
            ? "Click to toggle availability in donor search"
            : "Unavailable during resting cooldown"
        }
      >
        {isAvailable && <span className="donor-pulse-dot"></span>}
        <Activity size={16} />
        <span>{isAvailable ? "Available" : "Unavailable"}</span>
      </button>

      <button
        type="button"
        onClick={handleOpenNotifications}
        className="dashboard-home-button"
        style={{ position: "relative", padding: "8px", borderRadius: "50%" }}
        title="Notifications"
        aria-label={`Open notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              backgroundColor: "var(--color-critical)",
              color: "white",
              fontSize: "0.65rem",
              fontWeight: "bold",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: "2px solid var(--color-surface)",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );

  // Render Sub-Views
  const renderDashboardOverview = () => {
    return (
      <div className="donor-dashboard-page">
        {/* Welcome Card */}
        <div className="donor-welcome-card">
          <div className="donor-welcome-info">
            <h2>Welcome back, {displayName}</h2>
            <p>
              Your donations empower life-saving medical care. Thank you for being a registered donor.
            </p>
          </div>
          <div className="donor-blood-tag">
            <Droplet size={18} />
            <span>Blood Group: {profile?.blood_group || "--"}</span>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Blood Group"
            value={profile?.blood_group || "--"}
            subtitle="Whole Blood Donor"
            Icon={Droplet}
            colorClass="text-primary"
          />
          <StatCard
            title="Total Donations"
            value={`${profile?.donations ?? dashboardStats?.total_donations ?? 0} Times`}
            subtitle={`~${(profile?.donations ?? dashboardStats?.total_donations ?? 0) * 3} lives supported`}
            Icon={Award}
            colorClass="text-primary"
          />
          <StatCard
            title="Donation Eligibility"
            value={isEligible ? "Eligible Now" : nextEligible}
            subtitle={isEligible ? "Ready to donate blood" : "Required resting period"}
            Icon={Calendar}
            colorClass={isEligible ? "text-success" : "text-warning"}
          />
          <StatCard
            title="Emergency Search"
            value={isAvailable ? "Available" : "Unavailable"}
            subtitle={
              isEligible
                ? isAvailable
                  ? "Reachable for urgent requests"
                  : "Hidden from rapid alerts"
                : "Inactive (Cooldown period)"
            }
            Icon={Activity}
            colorClass={isAvailable ? "text-success" : "text-muted"}
          />
        </div>

        {/* Resting Period Notice if ineligible */}
        {!isEligible && (
          <div
            className="card"
            style={{
              borderLeft: "4px solid var(--color-warning)",
              padding: "16px 20px",
              marginBottom: "var(--spacing-6)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Clock size={24} style={{ color: "var(--color-warning)", flexShrink: 0 }} />
              <div>
                <h4
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "1rem",
                    color: "var(--color-text-main)",
                    fontWeight: 600,
                  }}
                >
                  Post-Donation Rest Period Active
                </h4>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  Safe medical standards require a 90-day interval between whole blood donations.
                  You will be eligible again on <strong>{nextEligible}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="donor-actions-grid">
          <button
            type="button"
            className="donor-action-btn"
            onClick={isEligible ? handleToggleAvailability : null}
            disabled={!isEligible}
            style={{ opacity: isEligible ? 1 : 0.6 }}
          >
            <div className={`donor-action-icon ${isAvailable ? "success" : "secondary"}`}>
              <Activity size={22} />
            </div>
            <div>
              <p className="donor-action-title">
                {isAvailable ? "Mark Unavailable" : "Mark Available"}
              </p>
              <p className="donor-action-desc">
                {isAvailable ? "Pause emergency match" : "Enable rapid matching"}
              </p>
            </div>
          </button>

          <button
            type="button"
            className="donor-action-btn"
            onClick={() => setActiveTab(DONOR_TABS.CAMPS)}
          >
            <div className="donor-action-icon primary">
              <Calendar size={22} />
            </div>
            <div>
              <p className="donor-action-title">Upcoming Camps</p>
              <p className="donor-action-desc">Explore donation drives nearby</p>
            </div>
          </button>

          <button
            type="button"
            className="donor-action-btn"
            onClick={() => setActiveTab(DONOR_TABS.HISTORY)}
          >
            <div className="donor-action-icon secondary">
              <History size={22} />
            </div>
            <div>
              <p className="donor-action-title">Donation History</p>
              <p className="donor-action-desc">View past records & certificates</p>
            </div>
          </button>
        </div>

        {/* Two Column Layout: Camps & QR Digital Pass */}
        <div className="donor-overview-layout">
          {/* Left: Upcoming Camps */}
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <h3 className="card-title">
                <Calendar size={20} />
                <span>Upcoming Blood Drives</span>
              </h3>
              <button
                type="button"
                className="dashboard btn btn-outline"
                style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                onClick={() => setActiveTab(DONOR_TABS.CAMPS)}
              >
                View All
              </button>
            </div>
            <div className="card-body">
              {upcomingCamps && upcomingCamps.length > 0 ? (
                <div className="donor-camp-list">
                  {upcomingCamps.slice(0, 3).map((camp) => (
                    <div key={camp.id} className="donor-camp-item">
                      <div>
                        <h4 className="donor-camp-title">{camp.title}</h4>
                        <div className="donor-camp-meta">
                          <span>
                            <MapPin size={13} /> {camp.location}
                          </span>
                          <span>
                            <Calendar size={13} /> {camp.date}
                          </span>
                          <span>
                            <Clock size={13} /> {camp.start_time}
                          </span>
                        </div>
                      </div>
                      <div>
                        {camp.is_registered ? (
                          <StatusBadge status="registered" />
                        ) : (
                          <button
                            type="button"
                            className="dashboard btn btn-primary"
                            style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                            onClick={() => handleRegisterCamp(camp.id)}
                            disabled={!isEligible || registeringCampId === camp.id}
                          >
                            {registeringCampId === camp.id
                              ? "Registering..."
                              : isEligible
                              ? "Register"
                              : "Ineligible"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="donor-empty-state">
                  <div className="donor-empty-icon">
                    <Calendar size={28} />
                  </div>
                  <h3>No Scheduled Drives Found</h3>
                  <p>Check back later or view community drives scheduled across other regions.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Digital Pass & QR Code */}
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <h3 className="card-title">
                <QrCode size={20} />
                <span>Digital Donor Pass</span>
              </h3>
              <span className="status-badge success">Verified</span>
            </div>
            <div className="card-body">
              <div className="donor-pass-container">
                <div className="donor-qr-wrapper">
                  <QRCodeCanvas
                    value={`${window.location.origin}/donor/scan/${profile?.qr_id || "DEMO-DONOR"}`}
                    size={160}
                    level={"H"}
                    includeMargin={false}
                  />
                </div>
                <div className="donor-id-badge">
                  ID: {profile?.qr_id || "GENERATING..."}
                </div>

                <div className="donor-pass-info-grid">
                  <div className="donor-pass-info-item">
                    <p className="donor-pass-info-label">Blood Type</p>
                    <p className="donor-pass-info-val">{profile?.blood_group || "--"}</p>
                  </div>
                  <div className="donor-pass-info-item">
                    <p className="donor-pass-info-label">NIC Number</p>
                    <p className="donor-pass-info-val">{profile?.nic_number || "Verified"}</p>
                  </div>
                  <div className="donor-pass-info-item">
                    <p className="donor-pass-info-label">Hospital</p>
                    <p className="donor-pass-info-val" style={{ fontSize: "0.8rem" }}>
                      {profile?.hospital || "National Center"}
                    </p>
                  </div>
                  <div className="donor-pass-info-item">
                    <p className="donor-pass-info-label">Total Donated</p>
                    <p className="donor-pass-info-val">{profile?.donations || 0} times</p>
                  </div>
                </div>

                <p className="donor-pass-hint">
                  Present this QR pass at registered donation drives or hospitals for instant registration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryView = () => {
    const totalCount = donationsMeta?.count || 0;
    const currentPage = donationsMeta?.currentPage || 1;
    const totalPages = Math.ceil(totalCount / 10) || 1;

    return (
      <div className="donor-dashboard-page">
        <div className="donor-history-filter-bar">
          <div>
            <h2 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700 }}>
              Donation Records
            </h2>
            <p style={{ margin: "2px 0 0 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              {totalCount} total donation{totalCount !== 1 ? "s" : ""} on record
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} style={{ color: "var(--color-text-muted)" }} />
            <select
              className="donor-select-input"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              aria-label="Filter donations by status"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {donationsLoading ? (
          <div className="donor-empty-state">
            <div className="spinner"></div>
            <p style={{ marginTop: "12px" }}>Loading donation records...</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={["Date", "Hospital", "Blood Group", "Units", "Status", "Notes"]}
              data={donations}
              emptyMessage="No donation records found for this filter."
              renderRow={(row, idx) => (
                <tr key={row.id || idx}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={14} style={{ color: "var(--color-text-muted)" }} />
                      <span>
                        {new Date(row.donation_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                  <td>{row.hospital_display || row.hospital_name || "National Blood Center"}</td>
                  <td>
                    <span className="status-badge info">{row.blood_group || profile?.blood_group}</span>
                  </td>
                  <td>{row.units || 1} Unit(s)</td>
                  <td>
                    <StatusBadge status={row.status || "completed"} />
                  </td>
                  <td style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    {row.notes || "—"}
                  </td>
                </tr>
              )}
            />

            {totalCount > 10 && (
              <div className="donor-pagination-bar">
                <button
                  type="button"
                  className="dashboard btn btn-outline"
                  disabled={!donationsMeta?.previous}
                  onClick={() => fetchDonations(currentPage - 1)}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="dashboard btn btn-outline"
                  disabled={!donationsMeta?.next}
                  onClick={() => fetchDonations(currentPage + 1)}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderCampsView = () => {
    return (
      <div className="donor-dashboard-page">
        <div>
          <h2 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700 }}>
            Upcoming Blood Donation Drives
          </h2>
          <p style={{ margin: "2px 0 var(--spacing-4) 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Participate in community donation drives organized by regional medical centers.
          </p>
        </div>

        {/* Search Bar */}
        <div className="donor-camps-search-bar">
          <Search size={18} style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            className="donor-camps-search-input"
            placeholder="Search drives by name, city, or venue..."
            value={campSearch}
            onChange={(e) => setCampSearch(e.target.value)}
          />
          {campSearch && (
            <button
              type="button"
              className="dashboard btn"
              style={{ padding: "2px 8px", fontSize: "0.75rem" }}
              onClick={() => setCampSearch("")}
            >
              Clear
            </button>
          )}
        </div>

        {filteredCamps.length === 0 ? (
          <div className="donor-empty-state">
            <div className="donor-empty-icon">
              <Calendar size={28} />
            </div>
            <h3>No Drives Match Your Search</h3>
            <p>Try searching for a different area or clear your search query.</p>
          </div>
        ) : (
          <div className="donor-camps-grid">
            {filteredCamps.map((camp) => (
              <div key={camp.id} className="card" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
                <div className="card-header">
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{camp.title}</h4>
                  {camp.is_registered && <StatusBadge status="registered" />}
                </div>
                <div className="card-body" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                    <MapPin size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                    <span>{camp.location}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                    <Calendar size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                    <span>
                      {camp.date} ({camp.start_time} - {camp.end_time || "End"})
                    </span>
                  </div>
                  {camp.destination_hospital_display && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                      <Hospital size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                      <span>Beneficiary: {camp.destination_hospital_display}</span>
                    </div>
                  )}
                  {camp.description && (
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--color-text-main)", opacity: 0.85 }}>
                      {camp.description}
                    </p>
                  )}

                  <div style={{ marginTop: "auto", paddingTop: "12px" }}>
                    <button
                      type="button"
                      className="dashboard btn btn-primary"
                      style={{ width: "100%" }}
                      disabled={camp.is_registered || !isEligible || registeringCampId === camp.id}
                      onClick={() => handleRegisterCamp(camp.id)}
                    >
                      {camp.is_registered
                        ? "Registered"
                        : registeringCampId === camp.id
                        ? "Registering..."
                        : isEligible
                        ? "Register to Donate"
                        : "Ineligible (Resting)"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProfileView = () => {
    return (
      <div className="donor-dashboard-page">
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
            <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <User size={20} />
              <span>Personal & Medical Profile</span>
            </h3>
            {!isEditingProfile ? (
              <button
                type="button"
                className="dashboard btn btn-primary"
                onClick={handleStartEditProfile}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", width: "auto", flexShrink: 0, padding: "8px 18px" }}
              >
                <Edit2 size={16} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: "flex", gap: "12px", width: "auto", flexShrink: 0 }}>
                <button
                  type="button"
                  className="dashboard btn btn-outline"
                  onClick={handleCancelEditProfile}
                  disabled={profileSaving}
                  style={{ width: "auto", padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dashboard btn btn-primary"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  style={{ width: "auto", padding: "8px 16px" }}
                >
                  {profileSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          <div className="card-body">
            {/* Top Profile Header with Avatar */}
            <div className="donor-profile-top">
              <div className="donor-avatar-container">
                {avatarPreview || profile?.profile_image ? (
                  <img
                    src={avatarPreview || profile?.profile_image}
                    alt="Donor Avatar"
                    className="donor-avatar-img"
                  />
                ) : (
                  <div className="donor-avatar-placeholder">
                    {profile?.fullName?.charAt(0) || "D"}
                  </div>
                )}
                {isEditingProfile && (
                  <label className="donor-avatar-upload-overlay" title="Change Profile Picture">
                    <Camera size={18} />
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleAvatarFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>

              <div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.3rem", fontWeight: 700 }}>
                  {profile?.fullName || "Donor"}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  <span className="status-badge info">Group: {profile?.blood_group || "--"}</span>
                  <span className="status-badge neutral">NIC: {profile?.nic_number || "Not set"}</span>
                  <span className={`status-badge ${isAvailable ? "success" : "neutral"}`}>
                    {isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Form Grid */}
            <div className="donor-form-grid">
              <div className="donor-form-group">
                <label className="donor-form-label">
                  <IdCard size={14} /> Full Name (Verified)
                </label>
                <div className="donor-form-static">{profile?.fullName || "Not Provided"}</div>
              </div>

              <div className="donor-form-group">
                <label className="donor-form-label">
                  <Droplet size={14} /> Blood Group (Verified)
                </label>
                <div className="donor-form-static">{profile?.blood_group || "Not Provided"}</div>
              </div>

              <div className="donor-form-group">
                <label className="donor-form-label">
                  <ShieldCheck size={14} /> National Identity Card (NIC)
                </label>
                <div className="donor-form-static">{profile?.nic_number || "Not Provided"}</div>
              </div>

              <div className="donor-form-group">
                <label className="donor-form-label">
                  <Phone size={14} /> Contact Phone Number
                </label>
                {isEditingProfile ? (
                  <input
                    type="tel"
                    className="donor-form-input"
                    value={editFormData.phoneNumber}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phoneNumber: e.target.value })
                    }
                    placeholder="e.g. +94 77 123 4567"
                  />
                ) : (
                  <div className="donor-form-static">{profile?.phoneNumber || "Not Provided"}</div>
                )}
              </div>

              <div className="donor-form-group">
                <label className="donor-form-label">
                  <Hospital size={14} /> Preferred Nearest Hospital
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    className="donor-form-input"
                    value={editFormData.hospital}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, hospital: e.target.value })
                    }
                    placeholder="e.g. National Hospital of Sri Lanka"
                  />
                ) : (
                  <div className="donor-form-static">{profile?.hospital || "Not Provided"}</div>
                )}
              </div>

              <div className="donor-form-group">
                <label className="donor-form-label">
                  <Award size={14} /> Cumulative Donations
                </label>
                <div className="donor-form-static">
                  {profile?.donations ?? 0} Recorded Whole Blood Units
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsView = () => {
    return (
      <div className="donor-dashboard-page">
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">
              <Settings size={20} />
              <span>Donor Account & Notification Preferences</span>
            </h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: 600 }}>
                Emergency Blood Request Alerts
              </h4>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Control how you are notified when nearby medical facilities require your blood type for urgent procedures.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                  />
                  <div>
                    <strong style={{ fontSize: "0.9rem" }}>SMS Notifications</strong>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      Receive priority text messages during critical shortages.
                    </p>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                  />
                  <div>
                    <strong style={{ fontSize: "0.9rem" }}>Email Bulletins</strong>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      Monthly donation reminders and upcoming drive invitations.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "1rem", fontWeight: 600 }}>Security & Credentials</h4>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Need to reset your password or update your login credentials?
              </p>
              <button
                type="button"
                className="dashboard btn btn-outline"
                onClick={() => navigate("/forgot-password")}
              >
                Reset Account Password
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading && !profile) {
      return (
        <div className="donor-empty-state">
          <div className="spinner"></div>
          <p style={{ marginTop: "16px" }}>Loading donor portal data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case DONOR_TABS.DASHBOARD:
        return renderDashboardOverview();
      case DONOR_TABS.HISTORY:
        return renderHistoryView();
      case DONOR_TABS.CAMPS:
        return renderCampsView();
      case DONOR_TABS.PROFILE:
        return renderProfileView();
      case DONOR_TABS.SETTINGS:
        return renderSettingsView();
      default:
        return renderDashboardOverview();
    }
  };

  return (
    <DashboardLayout
      title={displayName}
      subtitle={`${profile?.blood_group ? `Group ${profile.blood_group} • ` : ""}${displayHospital}`}
      brandLabel={
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span
            style={{
              color: "var(--color-primary)",
              fontWeight: "bold",
              fontSize: "1.1em",
              textTransform: "none",
            }}
          >
            {displayName}
          </span>
          <span style={{ fontSize: "0.9em", letterSpacing: "0.5px" }}>DONOR PORTAL</span>
        </div>
      }
      menuItems={MENU_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={headerActions}
    >
      <div className="donor-dashboard-page">{renderContent()}</div>
    </DashboardLayout>
  );
};

export default DonorDashboard;
