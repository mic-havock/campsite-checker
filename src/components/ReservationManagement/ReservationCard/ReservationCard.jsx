import { format, parseISO } from "date-fns";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";
import { fetchCampsiteDetails } from "../../../api/campsites";
import {
  updateMonitoringStatus,
  userDeleteReservation,
} from "../../../api/reservationManagement";
import Campsite from "../../Campsite/Campsite";
import "./reservation-card.scss";

const ReservationCard = ({ reservation, onDelete, onStatsUpdate }) => {
  const [isMonitoringActive, setIsMonitoringActive] = useState(
    Boolean(reservation.monitoring_active)
  );
  const [campsiteDetails, setCampsiteDetails] = useState(null);
  const [showCampsiteModal, setShowCampsiteModal] = useState(false);

  // Update local state when the prop changes
  useEffect(() => {
    setIsMonitoringActive(Boolean(reservation.monitoring_active));
  }, [reservation.monitoring_active]);

  // Fetch campsite details when component mounts
  useEffect(() => {
    const loadCampsiteDetails = async () => {
      if (reservation.campsite_id) {
        try {
          const details = await fetchCampsiteDetails(reservation.campsite_id);
          setCampsiteDetails(details);
        } catch (err) {
          console.error("Failed to fetch campsite details:", err);
        }
      }
    };

    loadCampsiteDetails();
  }, [reservation.campsite_id]);

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
   * Deletes a reservation
   */
  const handleDelete = async () => {
    try {
      await userDeleteReservation(reservation.id);
      onDelete(reservation.id);
      onStatsUpdate();
    } catch (err) {
      console.error("Failed to delete reservation:", err);
    }
  };

  /**
   * Format date string to readable format
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {string} Formatted date string
   */
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      // parseISO correctly handles timezone issues
      const date = parseISO(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
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
              {formatDate(reservation.reservation_start_date)} -{" "}
              {formatDate(reservation.reservation_end_date)}
            </span>
          </div>
          <div className="reservation-actions">
            <button
              onClick={() => setShowCampsiteModal(true)}
              className="edit-button"
            >
              View Campsite
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

      {/* Campsite Component */}
      {showCampsiteModal && campsiteDetails && campsiteDetails[0] && (
        <div
          className="modal-overlay"
          onClick={() => setShowCampsiteModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Campsite
              campsite={{
                CampsiteName:
                  campsiteDetails[0].CampsiteName || "Unknown Campsite",
                CampsiteReservable:
                  campsiteDetails[0].CampsiteReservable ?? true,
                CampsiteType: campsiteDetails[0].CampsiteType || "Unknown Type",
                Loop: campsiteDetails[0].Loop || "",
                CampsiteID:
                  campsiteDetails[0].CampsiteID ||
                  reservation.campsite_id.toString(),
                ENTITYMEDIA: campsiteDetails[0].ENTITYMEDIA || [],
                ATTRIBUTES: campsiteDetails[0].ATTRIBUTES || [],
                PERMITTEDEQUIPMENT: campsiteDetails[0].PERMITTEDEQUIPMENT || [],
              }}
              facilityName={reservation.facility_name || "Unknown Facility"}
              isExpanded={false}
            />
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
    campsite_id: PropTypes.number.isRequired,
    facility_name: PropTypes.string,
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
