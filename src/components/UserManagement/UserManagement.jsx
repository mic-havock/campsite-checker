import { useState } from "react";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";
import {
  fetchReservations,
  fetchUserStats,
  updateBatchMonitoringStatus,
} from "../../api/userManagement";
import ReservationCard from "../UserManagement/ReservationCard/ReservationCard";
import "./user-management.scss";

/**
 * UserManagement component for managing user reservations
 * Allows searching by email and managing individual reservations
 *
 * @returns {JSX.Element} - Rendered component
 */
const UserManagement = () => {
  const [email, setEmail] = useState("");
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allMonitoringActive, setAllMonitoringActive] = useState(false);

  /**
   * Fetches reservations and stats for a given email address
   * @param {string} emailAddress - Email address to search for
   */
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

  /**
   * Updates monitoring status for all reservations
   * @param {boolean} active - New monitoring status
   */
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

  /**
   * Handles form submission for searching reservations
   * @param {Event} e - Form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      handleSearch(email);
    }
  };

  /**
   * Handles deletion of a reservation
   * @param {number} id - ID of the reservation to delete
   */
  const handleReservationDelete = (id) => {
    setReservations((prev) => prev.filter((res) => res.id !== id));
  };

  /**
   * Handles stats update after a reservation change
   */
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
      <div className="page-header">
        <h1>User Management</h1>
      </div>

      {/* Search Form */}
      <div className="unified-controls">
        <div className="controls-header">
          <h2>Search For Reservations</h2>
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
              <span className="stat-label">Successful Notifications:</span>
              <span className="stat-value">
                {stats.successfulNotifications}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Attempts:</span>
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
                <span className="toggle-text">Disable All Monitoring</span>
              </>
            ) : (
              <>
                <FaToggleOff className="toggle-icon" />
                <span className="toggle-text">Enable All Monitoring</span>
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

export default UserManagement;
