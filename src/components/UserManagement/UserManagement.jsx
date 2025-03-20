import { useState } from "react";
import {
  deleteReservation,
  fetchReservations,
  fetchUserStats,
  updateBatchMonitoringStatus,
  updateMonitoringStatus,
  updateReservationDates,
} from "../../api/userManagement";
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
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
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
   * Updates monitoring status for a reservation
   * @param {number} id - Reservation ID
   * @param {boolean} active - New monitoring status
   */
  const handleMonitoringUpdate = async (id, active) => {
    try {
      await updateMonitoringStatus(id, active);

      // Update local state
      setReservations((prev) =>
        prev.map((res) =>
          res.id === id ? { ...res, monitoring_active: active ? 1 : 0 } : res
        )
      );

      // Refresh stats
      const statsData = await fetchUserStats(email);
      setStats(statsData.stats);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Updates reservation dates
   * @param {number} id - Reservation ID
   * @param {string} startDate - New start date
   * @param {string} endDate - New end date
   */
  const handleDateUpdate = async (id, startDate, endDate) => {
    try {
      await updateReservationDates(id, startDate, endDate);

      // Update local state
      setReservations((prev) =>
        prev.map((res) =>
          res.id === id
            ? {
                ...res,
                reservation_start_date: startDate,
                reservation_end_date: endDate,
              }
            : res
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Deletes a reservation
   * @param {number} id - Reservation ID to delete
   */
  const handleDelete = async (id) => {
    try {
      await deleteReservation(id);

      // Update local state
      setReservations((prev) => prev.filter((res) => res.id !== id));

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

  return (
    <div className="user-management">
      <h1>User Management</h1>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-group">
          <label htmlFor="email">Email Address:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter email address"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error Display */}
      {error && <div className="error-message">{error}</div>}

      {/* User Stats */}
      {stats && (
        <div className="user-stats">
          <h3>User Statistics</h3>
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
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={allMonitoringActive}
              onChange={(e) => handleBatchMonitoringUpdate(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">
              {allMonitoringActive
                ? "Disable All Monitoring"
                : "Enable All Monitoring"}
            </span>
          </label>
        </div>
      )}

      {/* Reservations List */}
      {reservations.length > 0 && (
        <div className="reservations-list">
          <h3>Reservations</h3>
          <div className="reservations-grid">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="reservation-card">
                <div className="reservation-header">
                  <h4>
                    {reservation.campsite_name || "N/A"}
                    {reservation.campsite_number &&
                      ` #${reservation.campsite_number}`}
                    <br />
                  </h4>
                  <div className="reservation-actions">
                    <button
                      onClick={() => setSelectedReservation(reservation)}
                      className="edit-button"
                      title="Edit reservation dates"
                    >
                      Edit Dates
                    </button>
                    <button
                      onClick={() => handleDelete(reservation.id)}
                      className="delete-button"
                      title="Delete reservation"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="reservation-details">
                  <p className="dates">
                    <strong>Dates:</strong>
                    {new Date(
                      reservation.reservation_start_date
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(
                      reservation.reservation_end_date
                    ).toLocaleDateString()}
                  </p>
                  <p className="monitoring">
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <strong>Monitoring:</strong>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={reservation.monitoring_active}
                          onChange={() =>
                            handleMonitoringUpdate(
                              reservation.id,
                              !reservation.monitoring_active
                            )
                          }
                        />
                        <span className="toggle-slider">
                          <span className="toggle-text active">Active</span>
                          <span className="toggle-text inactive">Inactive</span>
                        </span>
                      </label>
                    </span>
                    <span className="attempts">
                      {reservation.attempts_made} attempts
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedReservation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Reservation</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDateUpdate(
                  selectedReservation.id,
                  dateRange.startDate,
                  dateRange.endDate
                );
                setSelectedReservation(null);
              }}
            >
              <div className="form-group">
                <label htmlFor="startDate">Start Date:</label>
                <input
                  type="date"
                  id="startDate"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">End Date:</label>
                <input
                  type="date"
                  id="endDate"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit">Save Changes</button>
                <button
                  type="button"
                  onClick={() => setSelectedReservation(null)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
