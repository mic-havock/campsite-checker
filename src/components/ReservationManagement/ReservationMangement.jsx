import { useState } from "react";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  fetchReservations,
  fetchUserStats,
  updateBatchMonitoringStatus,
} from "../../api/reservationManagement";
import ReservationCard from "./ReservationCard/ReservationCard";
import "./reservation-management.scss";

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
        fetchReservations(emailAddress),
        fetchUserStats(emailAddress),
      ]);

      setReservations(reservationsData.reservations);
      setStats(statsData.stats);

      // Update all monitoring status based on current reservations
      const allActive = reservationsData.reservations.every(
        (res) => res.monitoring_active
      );
      setAllMonitoringActive(allActive);
    } catch (err) {
      setError(err.message);
      setReservations([]);
      setStats(null);
      setAllMonitoringActive(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchMonitoringUpdate = async (active) => {
    if (!email) return;

    try {
      await updateBatchMonitoringStatus(email, active);

      // Update local state
      setReservations((prev) =>
        prev.map((res) => ({
          ...res,
          monitoring_active: active ? 1 : 0,
        }))
      );
      setAllMonitoringActive(active);

      // Refresh stats
      const statsData = await fetchUserStats(email);
      setStats(statsData.stats);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      handleSearch(email);
    }
  };

  const handleReservationDelete = (id) => {
    setReservations((prev) => prev.filter((res) => res.id !== id));
  };

  const handleStatsUpdate = async () => {
    if (!email) return;
    try {
      const statsData = await fetchUserStats(email);
      setStats(statsData.stats);
    } catch (err) {
      console.error("Failed to update stats:", err);
    }
  };

  return (
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

      {/* Search Form */}
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

      {/* Error Display */}
      {error && <div className="error-message">{error}</div>}

      {/* User Stats */}
      {stats && (
        <div className="user-stats">
          <h2>User Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Reservations:</span>
              <span className="stat-value">{stats.totalReservations}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Monitoring:</span>
              <span className="stat-value">{stats.activeMonitoring}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">
                Availability Notifications Sent:
              </span>
              <span className="stat-value">
                {stats.successfulNotifications}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Availability Checks:</span>
              <span className="stat-value">{stats.totalAttempts}</span>
            </div>
          </div>
        </div>
      )}

      {/* Batch Monitoring Toggle */}
      {reservations.length > 0 && (
        <div className="batch-monitoring">
          <button
            className={`simple-toggle ${
              allMonitoringActive ? "active" : "inactive"
            }`}
            onClick={() => handleBatchMonitoringUpdate(!allMonitoringActive)}
            aria-pressed={allMonitoringActive}
            title={
              allMonitoringActive
                ? "Disable all monitoring"
                : "Enable all monitoring"
            }
          >
            {allMonitoringActive ? (
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
        </div>
      )}

      {/* Reservations List */}
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
  );
};

export default ReservationManagement;
