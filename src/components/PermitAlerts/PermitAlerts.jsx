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
import { Helmet } from "react-helmet-async";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  createPermitWatch,
  getPermitCatalog,
  getPermitDivisions,
} from "../../api/permits";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import "./permit-alerts.scss";

/**
 * Curated catalog of wilderness permits - matches backend implementation.
 */
const PERMIT_CATALOG = [
  {
    id: "4675317",
    name: "Mount Rainier Wilderness & Climbing",
  },
  {
    id: "4675322",
    name: "North Cascades Backcountry",
  },
  {
    id: "4098362",
    name: "Olympic NP Wilderness",
  },
  {
    id: "250003",
    name: "Mount Margaret Backcountry",
  },
  {
    id: "233273",
    name: "Enchantments Advanced Lottery",
  },
];

/**
 * Parses YYYY-MM-DD into a local Date at noon.
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

/**
 * Extract permit ID from recreation.gov URL.
 * @param {string} url
 * @returns {string | null}
 */
const extractPermitIdFromUrl = (url) => {
  if (!url) return null;
  const match = url.match(/\/permits\/(\d+)/);
  return match ? match[1] : null;
};

const PermitAlerts = () => {
  const [selectedPermitId, setSelectedPermitId] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [selectedDivisions, setSelectedDivisions] = useState(new Set());
  const [divisionSearch, setDivisionSearch] = useState("");
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const [alertDetails, setAlertDetails] = useState({
    name: "",
    email: "",
    startDate: "",
    endDate: "",
  });
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const isSubmitting = useRef(false);

  const [rangeHoverDate, setRangeHoverDate] = useState(undefined);
  const [pickerDefaultMonth, setPickerDefaultMonth] = useState(() => new Date());

  // Load divisions when permit is selected
  useEffect(() => {
    if (!selectedPermitId) {
      setDivisions([]);
      setSelectedDivisions(new Set());
      return;
    }

    const loadDivisions = async () => {
      setLoadingDivisions(true);
      try {
        const divisionsArray = await getPermitDivisions(selectedPermitId);
        setDivisions(Array.isArray(divisionsArray) ? divisionsArray : []);
      } catch (error) {
        console.error("Failed to load divisions:", error);
        setDivisions([]);
      } finally {
        setLoadingDivisions(false);
      }
    };

    loadDivisions();
  }, [selectedPermitId]);

  // Handle URL paste
  const handleUrlPaste = useCallback(() => {
    const permitId = extractPermitIdFromUrl(urlInput);
    if (permitId && PERMIT_CATALOG.some((p) => p.id === permitId)) {
      setSelectedPermitId(permitId);
      setUrlInput("");
    } else {
      alert("Could not extract permit ID from URL, or permit not in catalog.");
    }
  }, [urlInput]);

  // Filter divisions based on search
  const filteredDivisions = useMemo(() => {
    if (!divisionSearch) return divisions;
    const query = divisionSearch.toLowerCase();
    return divisions.filter((div) =>
      div.name?.toLowerCase().includes(query)
    );
  }, [divisions, divisionSearch]);

  // Date picker logic (similar to AlertModal)
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
      preview_middle: "permit-alerts-preview-middle",
      preview_start: "permit-alerts-preview-start",
      preview_end: "permit-alerts-preview-end",
    }),
    [],
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

  // Toggle division selection
  const toggleDivision = useCallback((divisionId) => {
    setSelectedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(divisionId)) {
        next.delete(divisionId);
      } else {
        next.add(divisionId);
      }
      return next;
    });
  }, []);

  // Select all filtered divisions
  const selectAllFiltered = useCallback(() => {
    setSelectedDivisions((prev) => {
      const next = new Set(prev);
      filteredDivisions.forEach((div) => next.add(div.id));
      return next;
    });
  }, [filteredDivisions]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setSelectedDivisions(new Set());
  }, []);

  const handleCreateAlert = async () => {
    if (isSubmitting.current) return;

    const { name, email, startDate, endDate } = alertDetails;
    if (!name || !email || !startDate || !endDate) {
      alert("Please fill in all fields.");
      return;
    }

    if (!selectedPermitId) {
      alert("Please select a wilderness permit.");
      return;
    }

    if (selectedDivisions.size === 0) {
      alert("Please select at least one camp/zone.");
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
      const selectedPermit = PERMIT_CATALOG.find((p) => p.id === selectedPermitId);
      
      const watchData = {
        name,
        email_address: email,
        permit_id: selectedPermitId,
        permit_name: selectedPermit?.name || "Unknown Permit",
        division_ids: Array.from(selectedDivisions),
        start_date: startDate,
        end_date: endDate,
        group_size: 2,
      };

      await createPermitWatch(watchData);
      setIsCreatingAlert(false);
      isSubmitting.current = false;

      // Reset form
      setAlertDetails({ name: "", email: "", startDate: "", endDate: "" });
      setSelectedPermitId("");
      setSelectedDivisions(new Set());
      setDivisionSearch("");

      window.setTimeout(() => {
        alert(
          `Permit alert created successfully!\n\nYou will receive a confirmation email shortly.\n\nIf availability opens up, you will receive another email notification.`,
        );
      }, 20);
    } catch (error) {
      setIsCreatingAlert(false);
      isSubmitting.current = false;
      window.setTimeout(() => {
        alert(error.message || "Failed to create permit alert. Please try again.");
      }, 20);
    }
  };

  return (
    <>
      <Helmet>
        <title>Permit Alerts | Kamp Scout</title>
        <meta name="theme-color" content="#2b4c1c" />
      </Helmet>
      <div className="permit-alerts">
        <div className="hero-section">
          <div className="hero-content">
            <h1>
              Wilderness Permit Alerts
              <span className="beta-badge">Beta</span>
            </h1>
            <p className="description">
              Get notified when wilderness permit availability opens up
            </p>
          </div>
        </div>

        <div className="permit-alerts-content">
          <div className="permit-alerts-form">
            {/* URL Helper */}
            <div className="form-section">
              <h2>Quick Start (Optional)</h2>
              <p className="section-description">
                Paste a Recreation.gov permit URL to auto-select the park
              </p>
              <div className="url-input-group">
                <input
                  type="text"
                  placeholder="https://www.recreation.gov/permits/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isCreatingAlert}
                />
                <button
                  onClick={handleUrlPaste}
                  disabled={!urlInput || isCreatingAlert}
                  className="parse-url-btn"
                >
                  Parse URL
                </button>
              </div>
            </div>

            {/* Permit Selection */}
            <div className="form-section">
              <h2>
                1. Select Wilderness Permit <span className="required">*</span>
              </h2>
              <select
                value={selectedPermitId}
                onChange={(e) => setSelectedPermitId(e.target.value)}
                disabled={isCreatingAlert}
                className="permit-select"
              >
                <option value="">-- Choose a permit --</option>
                {PERMIT_CATALOG.map((permit) => (
                  <option key={permit.id} value={permit.id}>
                    {permit.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Division Selection */}
            {selectedPermitId && (
              <div className="form-section">
                <h2>
                  2. Select Camps/Zones <span className="required">*</span>
                </h2>
                <p className="section-description">
                  Selected: {selectedDivisions.size} / {divisions.length}
                </p>

                {loadingDivisions ? (
                  <div className="loading-divisions">
                    <LoadingSpinner size="small" />
                    <span>Loading camps/zones...</span>
                  </div>
                ) : divisions.length > 0 ? (
                  <>
                    <div className="division-controls">
                      <input
                        type="text"
                        placeholder="Search camps/zones..."
                        value={divisionSearch}
                        onChange={(e) => setDivisionSearch(e.target.value)}
                        disabled={isCreatingAlert}
                        className="division-search"
                      />
                      <div className="division-buttons">
                        <button
                          onClick={selectAllFiltered}
                          disabled={isCreatingAlert}
                          className="select-all-btn"
                        >
                          Select All{divisionSearch ? " (filtered)" : ""}
                        </button>
                        <button
                          onClick={clearAllSelections}
                          disabled={isCreatingAlert}
                          className="clear-all-btn"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="divisions-list">
                      {filteredDivisions.length > 0 ? (
                        filteredDivisions.map((division) => (
                          <label
                            key={division.id}
                            className={`division-item ${
                              selectedDivisions.has(division.id)
                                ? "division-item--selected"
                                : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedDivisions.has(division.id)}
                              onChange={() => toggleDivision(division.id)}
                              disabled={isCreatingAlert}
                            />
                            <span className="division-name">{division.name}</span>
                          </label>
                        ))
                      ) : (
                        <p className="no-results">
                          No camps/zones match your search.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="no-divisions">
                    No camps/zones available for this permit. The backend may not
                    be available yet.
                  </p>
                )}
              </div>
            )}

            {/* Date Range */}
            {selectedPermitId && (
              <div className="form-section">
                <h2>
                  3. Select Date Range <span className="required">*</span>
                </h2>
                <div
                  className={`permit-alerts-date-range${
                    isCreatingAlert ? " permit-alerts-date-range--disabled" : ""
                  }`}
                >
                  {rangeHint && (
                    <p className="permit-alerts-range-hint" role="status">
                      {rangeHint.lead}
                      <strong>{rangeHint.emphasis}</strong>
                      {rangeHint.tail}
                    </p>
                  )}
                  {rangeSummaryLine && (
                    <p className="permit-alerts-range-summary">
                      <span className="permit-alerts-range-summary-dates">
                        {rangeSummaryLine.dates}
                      </span>
                      {rangeSummaryLine.nights > 0 && (
                        <span
                          className="permit-alerts-range-summary-nights"
                          aria-label={`${rangeSummaryLine.nightsLabel}`}
                        >
                          {` (${rangeSummaryLine.nightsLabel})`}
                        </span>
                      )}
                    </p>
                  )}
                  <div
                    className="permit-alerts-day-picker-wrap"
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
                      className="permit-alerts-day-picker"
                      aria-label="Choose arrival and departure dates"
                      modifiers={rangePreviewModifiers}
                      modifiersClassNames={rangePreviewModifierClassNames}
                      onDayMouseEnter={handlePreviewTargetDay}
                      onDayFocus={handlePreviewTargetDay}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info */}
            {selectedPermitId && (
              <div className="form-section">
                <h2>
                  4. Contact Information <span className="required">*</span>
                </h2>
                <input
                  type="text"
                  placeholder="Name"
                  aria-label="Name"
                  value={alertDetails.name}
                  onChange={(e) =>
                    setAlertDetails((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={isCreatingAlert}
                  className="contact-input"
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
                  className="contact-input"
                />
              </div>
            )}

            {/* Create Button */}
            {selectedPermitId && (
              <div className="form-section">
                <button
                  onClick={handleCreateAlert}
                  disabled={isCreatingAlert}
                  className="create-permit-alert-btn"
                >
                  {isCreatingAlert ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span style={{ marginLeft: "8px" }}>Creating...</span>
                    </>
                  ) : (
                    "Create Permit Alert"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PermitAlerts;
