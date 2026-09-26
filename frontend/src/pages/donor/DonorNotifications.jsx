import React, { useEffect, useState } from "react";
import { getDonorAlerts, markAlertRead } from "../../services/alertService";
import {
  Bell,
  MapPin,
  CheckCircle,
  X as XIcon,
  AlertTriangle,
  Info,
  ArrowLeft,
  CheckCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DonorNotifications = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      const data = await getDonorAlerts();
      setAlerts(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error("Error fetching alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // 10s Live update polling
    const intervalId = setInterval(() => {
      fetchAlerts();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const handleDismissAlert = async (alertId) => {
    try {
      await markAlertRead(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error("Failed to dismiss alert", err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter((a) => !a.is_read);
    try {
      await Promise.allSettled(unread.map((a) => markAlertRead(a.id)));
      setAlerts([]);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const alertIcon = (type) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle size={20} style={{ color: "var(--color-critical)" }} />;
      case "eligibility":
        return <CheckCircle size={20} style={{ color: "var(--color-success)" }} />;
      case "camp":
        return <MapPin size={20} style={{ color: "var(--color-primary)" }} />;
      default:
        return <Info size={20} style={{ color: "var(--color-text-muted)" }} />;
    }
  };

  const unreadAlerts = alerts.filter((a) => !a.is_read);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
        color: "var(--color-text-main)",
        padding: "var(--spacing-8) var(--spacing-4)",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--spacing-6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="dashboard btn btn-outline"
              style={{
                width: "40px",
                height: "40px",
                padding: 0,
                borderRadius: "50%",
              }}
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
                Donor Notifications
              </h1>
              <p
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                }}
              >
                Urgent blood requests and donation drive updates
              </p>
            </div>
          </div>

          {unreadAlerts.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="dashboard btn btn-outline"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
            >
              <CheckCheck size={16} /> Mark All as Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="card" style={{ padding: "40px", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 12px auto" }}></div>
            <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading alerts...</p>
          </div>
        ) : unreadAlerts.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "48px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "var(--color-secondary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                color: "var(--color-text-muted)",
              }}
            >
              <Bell size={32} />
            </div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "1.2rem", fontWeight: 600 }}>
              All Caught Up!
            </h3>
            <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.9rem" }}>
              You have no new alerts. We will notify you when urgent blood requirements arise in your area.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {unreadAlerts.map((a) => (
              <div
                key={a.id}
                className="card"
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  gap: "16px",
                  borderLeft:
                    a.alert_type === "urgent"
                      ? "4px solid var(--color-critical)"
                      : "4px solid var(--color-primary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{ marginTop: "2px" }}>{alertIcon(a.alert_type)}</div>
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color:
                          a.alert_type === "urgent"
                            ? "var(--color-critical)"
                            : "var(--color-primary)",
                        marginBottom: "2px",
                      }}
                    >
                      {a.alert_type || "Update"}
                    </strong>
                    <p
                      style={{
                        margin: "0 0 6px 0",
                        fontSize: "0.95rem",
                        fontWeight: 500,
                        color: "var(--color-text-main)",
                      }}
                    >
                      {a.message}
                    </p>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismissAlert(a.id)}
                  className="dashboard-home-button"
                  style={{
                    padding: "6px",
                    borderRadius: "50%",
                    color: "var(--color-text-muted)",
                  }}
                  title="Mark as Read"
                  aria-label="Dismiss alert"
                >
                  <XIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorNotifications;
