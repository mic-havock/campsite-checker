import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  LuMousePointerClick,
  LuToggleLeft,
  LuToggleRight,
  LuTrash2,
} from "react-icons/lu";
import { fetchCampsiteDetails } from "../../../api/campsites";
import {
  updateMonitoringStatus,
  userDeleteReservation,
} from "../../../api/reservationManagement";
import Campsite from "../../Campsite/Campsite";
import "./reservation-row.scss";

/**
 * Convert a stored campsite/facility name into Title Case for display.
 *
 * @param {string} value
 * @returns {string}
 */
const toTitleCase = (value) => {
  if (!value) {
    return "";
  }
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Massage the raw `/campsites/:id` payload into the shape expected by the
 * Campsite preview component used inside the modal.
 *
 * @param {Record<string, unknown>} details
 * @param {Object} reservation
 * @returns {Object}
 */
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
 * The campsite-detail endpoint may return a single object or an array of one;
 * normalize to a single record so the preview always has a stable shape.
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

/**
 * @typedef {Object} ReservationRowProps
 * @property {Object} reservation - Reservation record from the API.
 * @property {(id: number) => void | Promise<void>} onDelete - Called after a successful delete.
 * @property {() => void | Promise<void>} onStatsUpdate - Called after a state change to refresh stats.
 */

/**
 * A compact, row-style replacement for the previous large reservation card.
 * Designed to be packed densely inside grouped (campground -> date range)
 * sections, so users with many reservations can scan and act quickly.
 *
 * @param {ReservationRowProps} props
 * @returns {JSX.Element}
 */
const ReservationRow = ({ reservation, onDelete, onStatsUpdate }) => {
  const [isMonitoringActive, setIsMonitoringActive] = useState(
    Boolean(reservation.monitoring_active),
  );
  const [showCampsiteModal, setShowCampsiteModal] = useState(false);
  const [campsiteDetails, setCampsiteDetails] = useState(null);
  const [campsiteDetailsLoading, setCampsiteDetailsLoading] = useState(false);
  const [campsiteDetailsError, setCampsiteDetailsError] = useState("");
  const [hasFetchedDetails, setHasFetchedDetails] = useState(false);

  // Keep local toggle state in sync with parent-driven batch updates.
  useEffect(() => {
    setIsMonitoringActive(Boolean(reservation.monitoring_active));
  }, [reservation.monitoring_active]);

  // Lazily load campsite details only the first time the user opens the modal,
  // so opening 700+ rows doesn't trigger 700 simultaneous detail requests.
  useEffect(() => {
    if (!showCampsiteModal || hasFetchedDetails) {
      return undefined;
    }
    if (!reservation.campsite_id) {
      return undefined;
    }
    let cancelled = false;
    const loadDetails = async () => {
      setCampsiteDetailsLoading(true);
      setCampsiteDetailsError("");
      try {
        const details = await fetchCampsiteDetails(reservation.campsite_id);
        if (!cancelled) {
          setCampsiteDetails(details);
          setHasFetchedDetails(true);
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
    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [showCampsiteModal, hasFetchedDetails, reservation.campsite_id]);

  // Close the modal on Escape.
  useEffect(() => {
    if (!showCampsiteModal) {
      return undefined;
    }
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowCampsiteModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCampsiteModal]);

  const handleMonitoringUpdate = useCallback(
    async (active) => {
      try {
        setIsMonitoringActive(active);
        await updateMonitoringStatus(reservation.id, active);
        await onStatsUpdate();
      } catch (err) {
        setIsMonitoringActive(!active);
        console.error("Failed to update monitoring status:", err);
      }
    },
    [reservation.id, onStatsUpdate],
  );

  const handleDelete = useCallback(async () => {
    try {
      await userDeleteReservation(reservation.id);
      await onDelete(reservation.id);
    } catch (err) {
      console.error("Failed to delete reservation:", err);
    }
  }, [reservation.id, onDelete]);

  const normalizedCampsiteDetail =
    normalizeCampsiteDetailRecord(campsiteDetails);

  // Render the modal through a portal mounted at document.body so it never
  // gets trapped by ancestor stacking contexts (the row uses `transform` on
  // hover, and parent groups create their own contexts).
  const modalRoot =
    typeof document !== "undefined" ? document.body : null;

  const modalNode =
    showCampsiteModal && reservation.campsite_id ? (
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
          aria-labelledby="reservation-row-modal-title"
          tabIndex={-1}
        >
          <h2 id="reservation-row-modal-title" className="visually-hidden">
            {`Campsite details for ${reservation.campsite_name ?? "reservation"}`}
          </h2>
          {campsiteDetailsLoading ? (
            <p className="reservation-campsite-modal-status">Loading…</p>
          ) : campsiteDetailsError ? (
            <p className="reservation-campsite-modal-status">
              {campsiteDetailsError}
            </p>
          ) : normalizedCampsiteDetail ? (
            <div
              className="reservation-campsite-preview-wrap"
              aria-describedby="reservation-row-modal-hint"
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
          ) : (
            <p className="reservation-campsite-modal-status">
              Campsite details are not available.
            </p>
          )}
          <div className="reservation-campsite-modal-footer">
            {!campsiteDetailsLoading &&
            !campsiteDetailsError &&
            normalizedCampsiteDetail ? (
              <p
                className="reservation-campsite-modal-hint"
                id="reservation-row-modal-hint"
              >
                <LuMousePointerClick
                  className="reservation-campsite-modal-hint-icon"
                  aria-hidden
                />
                <span>Click the card to open full campsite view.</span>
              </p>
            ) : null}
            <button
              type="button"
              className="reservation-campsite-modal-close"
              onClick={() => setShowCampsiteModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    ) : null;

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!showCampsiteModal) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showCampsiteModal]);

  const siteLabel =
    reservation.campsite_number && reservation.campsite_number.trim()
      ? reservation.campsite_number.trim()
      : toTitleCase(reservation.campsite_name) || "Site";

  return (
    <>
      <div
        className={`reservation-row ${isMonitoringActive ? "is-active" : "is-inactive"}`}
      >
        <div className="reservation-row__site">
          <span className="reservation-row__site-label">Site</span>
          <span className="reservation-row__site-value">{siteLabel}</span>
        </div>

        <div className="reservation-row__actions">
          <button
            type="button"
            className="reservation-row__monitor-toggle"
            onClick={() => handleMonitoringUpdate(!isMonitoringActive)}
            aria-pressed={isMonitoringActive}
            title={
              isMonitoringActive ? "Disable monitoring" : "Enable monitoring"
            }
          >
            {isMonitoringActive ? (
              <LuToggleRight className="reservation-row__monitor-icon" />
            ) : (
              <LuToggleLeft className="reservation-row__monitor-icon" />
            )}
            <span className="reservation-row__monitor-text">
              {isMonitoringActive ? "On" : "Off"}
            </span>
          </button>

          <button
            type="button"
            className="reservation-row__view-button"
            disabled={!reservation.campsite_id}
            onClick={() => setShowCampsiteModal(true)}
            title="View campsite details"
          >
            View
          </button>

          <button
            type="button"
            className="reservation-row__delete-button"
            onClick={handleDelete}
            title="Delete reservation"
            aria-label={`Delete reservation for site ${siteLabel}`}
          >
            <LuTrash2 className="reservation-row__delete-icon" />
          </button>
        </div>
      </div>

      {modalNode && modalRoot ? createPortal(modalNode, modalRoot) : null}
    </>
  );
};

ReservationRow.propTypes = {
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
    attempts_made: PropTypes.number,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onStatsUpdate: PropTypes.func.isRequired,
};

export default ReservationRow;
