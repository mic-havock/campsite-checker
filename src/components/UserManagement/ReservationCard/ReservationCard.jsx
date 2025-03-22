import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  deleteReservation,
  updateMonitoringStatus,
  updateReservationDates,
} from "../../../api/userManagement";
import "./reservation-card.scss";

/**
 * Type definition for a reservation
 * @typedef {Object} Reservation
 * @property {number} id - Unique identifier for the reservation
 * @property {string} campsite_name - Name of the campsite
 * @property {string} campsite_number - Number of the campsite
 * @property {string} reservation_start_date - Start date of the reservation
 * @property {string} reservation_end_date - End date of the reservation
 * @property {number} monitoring_active - Whether monitoring is active (0 or 1)
 * @property {number} attempts_made - Number of attempts made
 */

/**
 * ReservationCard component for displaying and managing a single reservation
 *
 * @param {Object} props - Component props
 * @param {Reservation} props.reservation - The reservation data
 * @param {Function} props.onDelete - Callback function when reservation is deleted
 * @param {Function} props.onStatsUpdate - Callback function when stats need to be updated
 * @returns {JSX.Element} - Rendered component
 */
const ReservationCard = ({ reservation, onDelete, onStatsUpdate }) => {
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [isMonitoringActive, setIsMonitoringActive] = useState(
    Boolean(reservation.monitoring_active)
  );

  // Update local state when the prop changes
  useEffect(() => {
    setIsMonitoringActive(Boolean(reservation.monitoring_active));
  }, [reservation.monitoring_active]);

  /**
   * Updates monitoring status for a reservation
   * @param {boolean} active - New monitoring status
   */
  const handleMonitoringUpdate = async (active) => {
    try {
      setIsMonitoringActive(active); // Update UI immediately
      await updateMonitoringStatus(reservation.id, active);
      onStatsUpdate();
    } catch (err) {
      setIsMonitoringActive(!active); // Revert on error
      console.error("Failed to update monitoring status:", err);
    }
  };

  /**
   * Updates reservation dates
   * @param {string} startDate - New start date
   * @param {string} endDate - New end date
   */
  const handleDateUpdate = async (startDate, endDate) => {
    try {
      await updateReservationDates(reservation.id, startDate, endDate);
      setSelectedReservation(null);
    } catch (err) {
      console.error("Failed to update reservation dates:", err);
    }
  };

  /**
   * Deletes a reservation
   */
  const handleDelete = async () => {
    try {
      await deleteReservation(reservation.id);
      onDelete(reservation.id);
      onStatsUpdate();
    } catch (err) {
      console.error("Failed to delete reservation:", err);
    }
  };

  /**
   * Format date to readable string
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="reservation-card">
        <div className="reservation-header">
          <h4>
            {reservation.campsite_name || "N/A"}
            {reservation.campsite_number && ` #${reservation.campsite_number}`}
          </h4>
          <div className="reservation-actions">
            <button
              onClick={() => setSelectedReservation(reservation)}
              className="edit-button"
              title="Edit reservation dates"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="delete-button"
              title="Delete reservation"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="reservation-details">
          <div className="detail-row">
            <span className="detail-label">Dates:</span>
            <span className="detail-value">
              {formatDate(reservation.reservation_start_date)} –{" "}
              {formatDate(reservation.reservation_end_date)}
            </span>
          </div>
          <div className="monitoring-row">
            <div className="monitoring-control">
              <span className="detail-label">Monitor:</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isMonitoringActive}
                  onChange={() => handleMonitoringUpdate(!isMonitoringActive)}
                />
                <span className="toggle-slider">
                  <span className="toggle-text active">On</span>
                  <span className="toggle-text inactive">Off</span>
                </span>
              </label>
            </div>
            <span className="attempts">
              {reservation.attempts_made} attempts
            </span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedReservation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Reservation</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDateUpdate(dateRange.startDate, dateRange.endDate);
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
    </>
  );
};

ReservationCard.propTypes = {
  reservation: PropTypes.shape({
    id: PropTypes.number.isRequired,
    campsite_name: PropTypes.string,
    campsite_number: PropTypes.string,
    reservation_start_date: PropTypes.string.isRequired,
    reservation_end_date: PropTypes.string.isRequired,
    monitoring_active: PropTypes.oneOfType([PropTypes.number, PropTypes.bool])
      .isRequired,
    attempts_made: PropTypes.number.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onStatsUpdate: PropTypes.func.isRequired,
};

export default ReservationCard;
