import PropTypes from "prop-types";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  fetchReservationsActive,
  fetchUserStatsActive,
  updateBatchMonitoringStatus,
} from "../../api/reservationManagement";
import ReservationCard from "./ReservationCard/ReservationCard";
import "./reservation-management.scss";

const StatsDisplay = ({ stats }) => {
  const defaultStats = {
    totalReservations: 0,
    activeMonitoring: 0,
    successfulNotifications: 0,
    totalAttempts: 0,
  };

  const displayStats = stats || defaultStats;

  return (
    <div className="user-stats">
      <h2>User Statistics</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total Reservations:</span>
          <span className="stat-value">{displayStats.totalReservations}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active Monitoring:</span>
          <span className="stat-value">{displayStats.activeMonitoring}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Availability Notifications Sent:</span>
          <span className="stat-value">
            {displayStats.successfulNotifications}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Availability Checks:</span>
          <span className="stat-value">{displayStats.totalAttempts}</span>
        </div>
      </div>
    </div>
  );
};

StatsDisplay.propTypes = {
  stats: PropTypes.shape({
    totalReservations: PropTypes.number,
    activeMonitoring: PropTypes.number,
    successfulNotifications: PropTypes.number,
    totalAttempts: PropTypes.number,
  }),
};

StatsDisplay.defaultProps = {
  stats: null,
};

const MonitoringToggle = ({ active, onToggle }) => (
  <button
    className={`simple-toggle ${active ? "active" : "inactive"}`}
    onClick={() => onToggle(!active)}
    aria-pressed={active}
    title={active ? "Disable all monitoring" : "Enable all monitoring"}
  >
    {active ? (
      <>
        <FaToggleOn className="toggle-icon" />
        <span className="toggle-text">All Monitoring - Enabled</span>
      </>
    ) : (
      <>
        <FaToggleOff className="toggle-icon" />
        <span className="toggle-text">All Monitoring - Disabled</span>
      </>
    )}
  </button>
);

MonitoringToggle.propTypes = {
  active: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

const ReservationManagement = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allMonitoringActive, setAllMonitoringActive] = useState(false);

  const handleSearch = async (emailAddress) => {
    try {
      setLoading(true);
      setError(null);

      const [reservationsData, statsData] = await Promise.all([
        fetchReservationsActive(emailAddress),
        fetchUserStatsActive(emailAddress),
      ]);

      setReservations(reservationsData.reservations);
      setStats(statsData.stats);
      setAllMonitoringActive(
        reservationsData.reservations.every((res) => res.monitoring_active)
      );
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
      setError(err.message);
      setReservations([]);
      setStats(null);
      setAllMonitoringActive(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStatsUpdate = async () => {
    if (!email) return;
    try {
      const response = await fetchUserStatsActive(email);
      if (response && response.stats) {
        setStats(response.stats);
      } else {
        setStats({
          totalReservations: 0,
          activeMonitoring: 0,
          successfulNotifications: 0,
          totalAttempts: 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
      setStats({
        totalReservations: 0,
        activeMonitoring: 0,
        successfulNotifications: 0,
        totalAttempts: 0,
      });
    }
  };

  const handleReservationDelete = async (id) => {
    try {
      setReservations((prev) => prev.filter((res) => res.id !== id));
      await handleStatsUpdate();
    } catch (err) {
      console.error("Failed to update after deletion:", err);
    }
  };

  const handleBatchMonitoringUpdate = async (active) => {
    if (!email) return;

    try {
      await updateBatchMonitoringStatus(email, active);
      setReservations((prev) =>
        prev.map((res) => ({
          ...res,
          monitoring_active: active ? 1 : 0,
        }))
      );
      setAllMonitoringActive(active);
      await handleStatsUpdate();
    } catch (err) {
      console.error("Failed to update batch monitoring:", err);
      setError(err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      handleSearch(email);
    }
  };

  const reservationSchema = {
    "@context": "https://schema.org",
    "@type": "ReservationPackage",
    name: "Campsite Reservation Management",
    description: "Manage and track your campsite reservation alerts",
    provider: {
      "@type": "Organization",
      name: "KampScout",
    },
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(reservationSchema)}
        </script>
      </Helmet>
      <div className="user-management">
        <button
          className="floating-button"
          onClick={() => navigate("/")}
          aria-label="Back to homepage"
        >
          Back to
          <br />
          Homepage
        </button>
        <div className="page-header">
          <h1>Reservation Management</h1>
        </div>

        <div className="unified-controls">
          <div className="controls-header">
            <h2>Search For Reservation Alerts</h2>
          </div>
          <div className="controls-body">
            <form onSubmit={handleSubmit} className="filter-options">
              <div className="form-group">
                <div className="input-button-group">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter email address"
                  />
                  <button
                    type="submit"
                    className="search-button"
                    disabled={loading}
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        <StatsDisplay stats={stats} />

        {reservations.length > 0 && (
          <div className="batch-monitoring">
            <MonitoringToggle
              active={allMonitoringActive}
              onToggle={handleBatchMonitoringUpdate}
            />
          </div>
        )}

        {reservations.length > 0 && (
          <div className="reservations-list">
            <h2>Reservations</h2>
            <div className="reservations-grid">
              {reservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  onDelete={handleReservationDelete}
                  onStatsUpdate={handleStatsUpdate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReservationManagement;
