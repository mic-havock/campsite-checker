import { format, parseISO } from "date-fns";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  LuMousePointerClick,
  LuToggleLeft,
  LuToggleRight,
} from "react-icons/lu";
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
  FacilityID: details.FacilityID,
  ENTITYMEDIA: details.ENTITYMEDIA || [],
  ATTRIBUTES: details.ATTRIBUTES || [],
  PERMITTEDEQUIPMENT: details.PERMITTEDEQUIPMENT || [],
});

/**
 * The GET /campsites/:id endpoint may return a single object or an array;
 * normalize to one record so the modal can render reliably.
 *
 * @param {unknown} data
 * @returns {Record<string, unknown> | null}
 */
const normalizeCampsiteDetailRecord = (data) => {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    const first = data[0];
    return typeof first === "object" && first !== null ? first : null;
  }
  return typeof data === "object" ? data : null;
};

const ReservationCard = ({ reservation, onDelete, onStatsUpdate }) => {
  const [isMonitoringActive, setIsMonitoringActive] = useState(
    Boolean(reservation.monitoring_active)
  );
  const [campsiteDetails, setCampsiteDetails] = useState(null);
  const [campsiteDetailsLoading, setCampsiteDetailsLoading] = useState(
    Boolean(reservation.campsite_id),
  );
  const [campsiteDetailsError, setCampsiteDetailsError] = useState("");
  const [showCampsiteModal, setShowCampsiteModal] = useState(false);

  useEffect(() => {
    setIsMonitoringActive(Boolean(reservation.monitoring_active));
  }, [reservation.monitoring_active]);

  useEffect(() => {
    let cancelled = false;

    const loadCampsiteDetails = async () => {
      if (!reservation.campsite_id) {
        setCampsiteDetailsLoading(false);
        return;
      }
      setCampsiteDetailsLoading(true);
      setCampsiteDetailsError("");
      try {
        const details = await fetchCampsiteDetails(reservation.campsite_id);
        if (!cancelled) {
          setCampsiteDetails(details);
        }
      } catch (err) {
        console.error("Failed to fetch campsite details:", err);
        if (!cancelled) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String(err.message)
              : "";
          setCampsiteDetailsError(
            message.trim() ||
              "Could not load campsite details. Try again later.",
          );
        }
      } finally {
        if (!cancelled) {
          setCampsiteDetailsLoading(false);
        }
      }
    };

    loadCampsiteDetails();
    return () => {
      cancelled = true;
    };
  }, [reservation.campsite_id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowCampsiteModal(false);
      }
    };
    if (showCampsiteModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCampsiteModal]);

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

  const normalizedCampsiteDetail =
    normalizeCampsiteDetailRecord(campsiteDetails);

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
              type="button"
              disabled={!reservation.campsite_id}
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
                    <LuToggleRight className="toggle-icon" />
                    <span className="toggle-text">Monitoring Enabled</span>
                  </>
                ) : (
                  <>
                    <LuToggleLeft className="toggle-icon" />
                    <span className="toggle-text">Monitoring Disabled</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCampsiteModal && reservation.campsite_id ? (
        <div
          className="modal-overlay"
          onClick={() => setShowCampsiteModal(false)}
          role="presentation"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setShowCampsiteModal(false);
            }
          }}
        >
          <div
            className="modal-content reservation-campsite-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-campsite-modal-title"
            tabIndex={-1}
          >
            <button
              type="button"
              className="reservation-campsite-modal-close"
              onClick={() => setShowCampsiteModal(false)}
            >
              Close
            </button>
            <h2
              id="reservation-campsite-modal-title"
              className="visually-hidden"
            >
              {`Campsite details for ${reservation.campsite_name ?? "reservation"}`}
            </h2>
            {campsiteDetailsLoading ? (
              <p className="reservation-campsite-modal-status">Loading…</p>
            ) : campsiteDetailsError ? (
              <p className="reservation-campsite-modal-status">
                {campsiteDetailsError}
              </p>
            ) : normalizedCampsiteDetail ? (
              <>
                <div
                  className="reservation-campsite-preview-wrap"
                  aria-describedby="reservation-campsite-modal-hint"
                >
                  <Campsite
                    campsite={transformCampsiteData(
                      normalizedCampsiteDetail,
                      reservation,
                    )}
                    facilityName={
                      reservation.facility_name || "Unknown Facility"
                    }
                    isExpanded={false}
                    showExpandHint={false}
                  />
                </div>
                <p
                  className="reservation-campsite-modal-hint"
                  id="reservation-campsite-modal-hint"
                >
                  <LuMousePointerClick
                    className="reservation-campsite-modal-hint-icon"
                    aria-hidden
                  />
                  <span>Click the card to open full campsite view.</span>
                </p>
              </>
            ) : (
              <p className="reservation-campsite-modal-status">
                Campsite details are not available.
              </p>
            )}
          </div>
        </div>
      ) : null}
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
