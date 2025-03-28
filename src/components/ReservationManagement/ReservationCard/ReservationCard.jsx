import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";
import {
  deleteReservation,
  updateMonitoringStatus,
  updateReservationDates,
} from "../../../api/reservationManagement";
import "./reservation-card.scss";

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
          <h4>{reservation.campsite_name || "N/A"}</h4>
          <h4>
            {reservation.campsite_number && `${reservation.campsite_number}`}
          </h4>
        </div>
        <div className="reservation-details">
          <div className="detail-row">
            <span className="detail-value">
              {formatDate(reservation.reservation_start_date)} –{" "}
              {formatDate(reservation.reservation_end_date)}
            </span>
          </div>
          <div className="reservation-actions">
            <button
              onClick={() => setSelectedReservation(reservation)}
              className="edit-button"
              title="Edit reservation dates"
            >
              Edit Dates
            </button>
            <button
              onClick={handleDelete}
              className="delete-button"
              title="Delete reservation"
            >
              Delete
            </button>
          </div>
          <div className="monitoring-row">
            <div className="monitoring-control">
              <button
                className={`simple-toggle ${
                  isMonitoringActive ? "active" : "inactive"
                }`}
                onClick={() => handleMonitoringUpdate(!isMonitoringActive)}
                aria-pressed={isMonitoringActive}
                title={
                  isMonitoringActive
                    ? "Disable monitoring"
                    : "Enable monitoring"
                }
              >
                {isMonitoringActive ? (
                  <>
                    <FaToggleOn className="toggle-icon" />
                    <span className="toggle-text">Monitoring Enabled</span>
                  </>
                ) : (
                  <>
                    <FaToggleOff className="toggle-icon" />
                    <span className="toggle-text">Monitoring Disabled</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedReservation && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedReservation(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
