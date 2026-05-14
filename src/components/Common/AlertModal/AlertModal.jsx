import PropTypes from "prop-types";
import {
  compareAsc,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfToday,
} from "date-fns";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  createBulkReservations,
  createReservation,
} from "../../../api/reservations";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import "./alert-modal.scss";

/**
 * Parses YYYY-MM-DD into a local Date at noon so month/day align with the picker.
 * @param {string} ymd
 * @returns {Date | undefined}
 */
const parseLocalYmd = (ymd) => {
  if (!ymd || typeof ymd !== "string") return undefined;
  const parts = ymd.split("-");
  if (parts.length !== 3) return undefined;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

/**
 * @param {Date | undefined} d
 * @returns {string}
 */
const toYmd = (d) => {
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
};

const AlertModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  alertDetails,
  setAlertDetails,
  isCreatingAlert,
  setIsCreatingAlert,
  selectedCampsite,
  selectedCampsites,
  campsiteName,
  isBulkAlert,
  facilityId,
}) => {
  const isSubmitting = useRef(false);
  const [rangeHoverDate, setRangeHoverDate] = useState(undefined);
  const [suggestedDates, setSuggestedDates] = useState({
    start: "",
    end: "",
  });
  const [pickerDefaultMonth, setPickerDefaultMonth] = useState(() => new Date());
  const openSessionSeededRef = useRef(false);

  // Closes the modal when clicking outside the modal content
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  // Clear form data and close modal
  const handleClose = useCallback(() => {
    setAlertDetails({ name: "", email: "", startDate: "", endDate: "" });
    onClose();
  }, [onClose, setAlertDetails]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Snapshot parent-provided dates as suggestions only (not DayPicker selection), so the
  // first click is always choosing arrival. Clears start/end in form state until the user selects.
  useLayoutEffect(() => {
    if (!isOpen) {
      openSessionSeededRef.current = false;
      setSuggestedDates({ start: "", end: "" });
      return;
    }
    if (openSessionSeededRef.current) {
      return;
    }
    openSessionSeededRef.current = true;

    const preStart = alertDetails.startDate;
    const preEnd = alertDetails.endDate;
    setPickerDefaultMonth(
      parseLocalYmd(preStart) ?? parseLocalYmd(preEnd) ?? new Date(),
    );
    setSuggestedDates({
      start: preStart || "",
      end: preEnd || "",
    });
    if (preStart || preEnd) {
      setAlertDetails((prev) => ({
        ...prev,
        startDate: "",
        endDate: "",
      }));
    }
  }, [isOpen, alertDetails.startDate, alertDetails.endDate, setAlertDetails]);

  const selectedRange = useMemo(() => {
    const from = parseLocalYmd(alertDetails.startDate);
    if (!from) return undefined;
    const to = parseLocalYmd(alertDetails.endDate);
    return { from, to: to ?? undefined };
  }, [alertDetails.startDate, alertDetails.endDate]);

  const rangeHint = useMemo(() => {
    if (!alertDetails.startDate) {
      return { lead: "Select your ", emphasis: "arrival date", tail: "." };
    }
    if (!alertDetails.endDate) {
      return { lead: "Select your ", emphasis: "departure date", tail: "." };
    }
    return null;
  }, [alertDetails.startDate, alertDetails.endDate]);

  const suggestedModifiers = useMemo(() => {
    if (alertDetails.startDate) {
      return {};
    }
    const suggested = parseLocalYmd(suggestedDates.start);
    if (!suggested) {
      return {};
    }
    const suggestedDay = startOfDay(suggested);
    return {
      suggested_arrival: (date) => isSameDay(startOfDay(date), suggestedDay),
    };
  }, [suggestedDates.start, alertDetails.startDate]);

  /**
   * @param {{ from?: Date, to?: Date } | undefined} range
   */
  const handleRangeSelect = (range) => {
    if (!range) {
      setAlertDetails((prev) => ({
        ...prev,
        startDate: "",
        endDate: "",
      }));
      return;
    }
    const start = range.from ? toYmd(range.from) : "";
    const end = range.to ? toYmd(range.to) : "";
    setAlertDetails((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
    }));
  };

  const weekdayFormatter = useMemo(
    () => ({
      formatWeekdayName: (weekday) => format(weekday, "EEE").slice(0, 1),
    }),
    [],
  );

  const rangeSummaryLine = useMemo(() => {
    if (!alertDetails.startDate || !alertDetails.endDate) return null;
    const fromD = parseLocalYmd(alertDetails.startDate);
    const toD = parseLocalYmd(alertDetails.endDate);
    if (!fromD || !toD) return null;
    const nights = Math.max(
      0,
      differenceInCalendarDays(startOfDay(toD), startOfDay(fromD)),
    );
    const nightsLabel = nights === 1 ? "1 night" : `${nights} nights`;
    return {
      dates: `${format(fromD, "MMM d, yyyy")} – ${format(toD, "MMM d, yyyy")}`,
      nights,
      nightsLabel,
    };
  }, [alertDetails.startDate, alertDetails.endDate]);

  const pastDatesDisabled = useMemo(() => ({ before: startOfToday() }), []);

  useEffect(() => {
    if (!isOpen) {
      setRangeHoverDate(undefined);
    }
  }, [isOpen]);

  useEffect(() => {
    if (alertDetails.endDate) {
      setRangeHoverDate(undefined);
    }
  }, [alertDetails.endDate]);

  const rangePreviewModifiers = useMemo(() => {
    const from = parseLocalYmd(alertDetails.startDate);
    if (!from || alertDetails.endDate || !rangeHoverDate) {
      return {};
    }
    const fromDay = startOfDay(from);
    const hoverDay = startOfDay(rangeHoverDate);
    if (isSameDay(fromDay, hoverDay)) {
      return {};
    }
    const low = compareAsc(fromDay, hoverDay) <= 0 ? fromDay : hoverDay;
    const high = compareAsc(fromDay, hoverDay) <= 0 ? hoverDay : fromDay;

    return {
      preview_middle: (date) => {
        const d = startOfDay(date);
        return isAfter(d, low) && isBefore(d, high);
      },
      preview_start: (date) => isSameDay(startOfDay(date), low),
      preview_end: (date) => isSameDay(startOfDay(date), high),
    };
  }, [alertDetails.startDate, alertDetails.endDate, rangeHoverDate]);

  const rangePreviewModifierClassNames = useMemo(
    () => ({
      preview_middle: "alert-modal-preview-middle",
      preview_start: "alert-modal-preview-start",
      preview_end: "alert-modal-preview-end",
    }),
    [],
  );

  const combinedModifiers = useMemo(
    () => ({
      ...suggestedModifiers,
      ...rangePreviewModifiers,
    }),
    [suggestedModifiers, rangePreviewModifiers],
  );

  const combinedModifierClassNames = useMemo(
    () => ({
      ...rangePreviewModifierClassNames,
      suggested_arrival: "alert-modal-suggested-arrival",
    }),
    [rangePreviewModifierClassNames],
  );

  const handlePreviewTargetDay = useCallback(
    (date, modifiers) => {
      if (isCreatingAlert || !alertDetails.startDate || alertDetails.endDate) {
        return;
      }
      if (modifiers.disabled) {
        return;
      }
      setRangeHoverDate(date);
    },
    [isCreatingAlert, alertDetails.startDate, alertDetails.endDate],
  );

  const handleCreateAlert = async () => {
    if (isSubmitting.current) return;

    const { name, email, startDate, endDate } = alertDetails;
    if (!name || !email || !startDate || !endDate) {
      alert("Please fill in all fields.");
      return;
    }

    if (endDate <= startDate) {
      alert("Departure must be after your arrival date.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    isSubmitting.current = true;
    setIsCreatingAlert(true);

    try {
      if (isBulkAlert && selectedCampsites?.length > 0) {
        // Create alerts for all selected campsites
        const reservations = selectedCampsites.map((campsite) => ({
          name,
          email_address: email,
          campsite_id:
            campsite.campsiteObj.CampsiteID || campsite.campsiteObj.campsite_id,
          campsite_number: campsite.campsite,
          campsite_name: campsiteName,
          facility_id: facilityId,
          reservation_start_date: startDate,
          reservation_end_date: endDate,
          monitoring_active: true,
          attempts_made: 0,
          success_sent: false,
        }));

        await createBulkReservations(reservations);
        setIsCreatingAlert(false);
        isSubmitting.current = false;
        handleClose();
        window.setTimeout(() => {
          alert(
            `Successfully created alerts for ${selectedCampsites.length} campsites!\n\nYou will receive a confirmation email shortly.\n\nIf any of your selections become available, you will receive email notifications.`,
          );
        }, 20);
      } else {
        // Single campsite alert
        const reservationData = {
          name,
          email_address: email,
          campsite_id:
            selectedCampsite.CampsiteID || selectedCampsite.campsite_id,
          campsite_number:
            selectedCampsite.site || selectedCampsite.CampsiteName,
          campsite_name: campsiteName,
          facility_id: facilityId,
          reservation_start_date: startDate,
          reservation_end_date: endDate,
          monitoring_active: true,
          attempts_made: 0,
          success_sent: false,
        };

        await createReservation(reservationData);
        setIsCreatingAlert(false);
        isSubmitting.current = false;
        handleClose();
        window.setTimeout(() => {
          alert(
            `Alert created successfully!\n\nYou will receive a confirmation email shortly.\n\nIf your selection becomes available, you will receive another email notification.`,
          );
        }, 20);
      }
    } catch (error) {
      setIsCreatingAlert(false);
      isSubmitting.current = false;
      window.setTimeout(() => {
        alert(error.message || "Failed to create alert. Please try again.");
      }, 20);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      key={`alert-modal-${isCreatingAlert}`}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {subtitle && <h3>{subtitle}</h3>}
        {isBulkAlert && selectedCampsites?.length > 0 && (
          <div className="selected-campsites">
            <p>Selected Campsites:</p>
            <ul>
              {selectedCampsites.map((campsite) => (
                <li key={campsite.campsite}>
                  {campsite.campsite} - {campsite.loop}
                </li>
              ))}
            </ul>
          </div>
        )}
        <input
          type="text"
          placeholder="Name"
          aria-label="Name"
          value={alertDetails.name}
          onChange={(e) =>
            setAlertDetails((prev) => ({ ...prev, name: e.target.value }))
          }
          disabled={isCreatingAlert}
        />
        <input
          type="email"
          placeholder="Email"
          aria-label="Email"
          value={alertDetails.email}
          onChange={(e) =>
            setAlertDetails((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
          disabled={isCreatingAlert}
        />
        <div
          className={`alert-modal-date-range${
            isCreatingAlert ? " alert-modal-date-range--disabled" : ""
          }`}
        >
          {rangeHint && (
            <p className="alert-modal-range-hint" role="status">
              {rangeHint.lead}
              <strong>{rangeHint.emphasis}</strong>
              {rangeHint.tail}
            </p>
          )}
          {rangeSummaryLine && (
            <p className="alert-modal-range-summary">
              <span className="alert-modal-range-summary-dates">
                {rangeSummaryLine.dates}
              </span>
              {rangeSummaryLine.nights > 0 && (
                <span
                  className="alert-modal-range-summary-nights"
                  aria-label={`${rangeSummaryLine.nightsLabel}`}
                >
                  {` (${rangeSummaryLine.nightsLabel})`}
                </span>
              )}
            </p>
          )}
          <div
            className="alert-modal-day-picker-wrap"
            onMouseLeave={() => setRangeHoverDate(undefined)}
          >
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={handleRangeSelect}
              defaultMonth={pickerDefaultMonth}
              captionLayout="dropdown"
              resetOnSelect
              formatters={weekdayFormatter}
              disabled={isCreatingAlert ? () => true : pastDatesDisabled}
              className="alert-modal-day-picker"
              aria-label="Choose arrival and departure dates"
              modifiers={combinedModifiers}
              modifiersClassNames={combinedModifierClassNames}
              onDayMouseEnter={handlePreviewTargetDay}
              onDayFocus={handlePreviewTargetDay}
            />
          </div>
        </div>
        <div className="modal-buttons">
          <button
            onClick={handleCreateAlert}
            disabled={isCreatingAlert}
            className="create-alert-btn"
          >
            {isCreatingAlert ? (
              <>
                <LoadingSpinner size="small" />
                <span style={{ marginLeft: "8px" }}>Creating...</span>
              </>
            ) : (
              "Create"
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={isCreatingAlert}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

AlertModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  alertDetails: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
  }).isRequired,
  setAlertDetails: PropTypes.func.isRequired,
  isCreatingAlert: PropTypes.bool.isRequired,
  setIsCreatingAlert: PropTypes.func.isRequired,
  selectedCampsite: PropTypes.object,
  selectedCampsites: PropTypes.arrayOf(PropTypes.object),
  campsiteName: PropTypes.string.isRequired,
  isBulkAlert: PropTypes.bool,
  facilityId: PropTypes.string,
};

AlertModal.defaultProps = {
  isBulkAlert: false,
};

export default AlertModal;
