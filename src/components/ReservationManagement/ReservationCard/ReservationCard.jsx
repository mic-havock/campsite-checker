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

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const transformCampsiteData = (details, reservation) => ({
  CampsiteName: details.CampsiteName || "Unknown Campsite",
  CampsiteReservable: details.CampsiteReservable ?? true,
  CampsiteType: details.CampsiteType || "Unknown Type",
  Loop: details.Loop || "",
  CampsiteID: details.CampsiteID || reservation.campsite_id.toString(),
  ENTITYMEDIA: details.ENTITYMEDIA || [],
  ATTRIBUTES: details.ATTRIBUTES || [],
  PERMITTEDEQUIPMENT: details.PERMITTEDEQUIPMENT || [],
});

const ReservationCard = ({ reservation, onDelete, onStatsUpdate }) => {
  const [isMonitoringActive, setIsMonitoringActive] = useState(
    Boolean(reservation.monitoring_active)
  );
  const [campsiteDetails, setCampsiteDetails] = useState(null);
  const [showCampsiteModal, setShowCampsiteModal] = useState(false);

  useEffect(() => {
    setIsMonitoringActive(Boolean(reservation.monitoring_active));
  }, [reservation.monitoring_active]);

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

  const handleMonitoringUpdate = async (active) => {
    try {
      setIsMonitoringActive(active);
      await updateMonitoringStatus(reservation.id, active);
      await onStatsUpdate();
    } catch (err) {
      setIsMonitoringActive(!active);
      console.error("Failed to update monitoring status:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await userDeleteReservation(reservation.id);
      await onDelete(reservation.id);
    } catch (err) {
      console.error("Failed to delete reservation:", err);
    }
  };

  return (
    <>
      <div className="reservation-card">
        <div className="reservation-header">
          <h4 className="campsite-name">
            {toTitleCase(reservation.campsite_name) || "N/A"}
          </h4>
          <h4 className="campsite-number">
            {reservation.campsite_number && `${reservation.campsite_number}`}
          </h4>
        </div>
        <div className="campground-availability">
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

      {showCampsiteModal && campsiteDetails && campsiteDetails[0] && (
        <div
          className="modal-overlay"
          onClick={() => setShowCampsiteModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Campsite
              campsite={transformCampsiteData(campsiteDetails[0], reservation)}
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
    campsite_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
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
