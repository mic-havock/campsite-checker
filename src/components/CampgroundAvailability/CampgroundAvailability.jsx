import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { LuCalendar, LuChevronDown, LuChevronUp } from "react-icons/lu";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampgroundAvailability } from "../../api/campsites";
import { isNonReservableStatus } from "../../config/reservationStatus";
import { getUtcDateStringsForMonth } from "../../utils/dateUtils";
import AlertModal from "../Common/AlertModal/AlertModal";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import "./campground-availability.scss";

const getNextMonths = () => {
  const months = [];
  const currentDate = new Date();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  for (let i = 0; i < 12; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1
    );
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();

    months.push({
      value: date.toISOString(),
      label: `${monthName} ${year}`,
      month: monthName,
      year: year,
    });
  }
  return months;
};

const CampgroundAvailability = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [availabilityData, setAvailabilityData] = useState(
    location.state?.availabilityData
  );
  const facilityID = location.state?.facilityID;
  const facilityName =
    location.state?.facilityName || location.state?.campsiteName;
  const facilityState = location.state?.facilityState;
  const [alertModal, setAlertModal] = useState(false);
  const [selectedCampsite, setSelectedCampsite] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [alertDetails, setAlertDetails] = useState({
    name: "",
    email: "",
    startDate: "",
    endDate: "",
  });
  const [startDate, setStartDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [hideNotReservable, setHideNotReservable] = useState(false);
  const isMounted = useRef(true);

  const [selectedCampsiteIds, setSelectedCampsiteIds] = useState(new Set());
  const [bulkAlertModal, setBulkAlertModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "campsite", direction: "asc" });

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const { dates, rowData, missingSeasonDates } = useMemo(() => {
    if (!availabilityData || !availabilityData.campsites) {
      return { dates: [], rowData: [], missingSeasonDates: false };
    }

    const campsitesData = Object.values(availabilityData.campsites);
    const hasAnyAvailabilityKeys = campsitesData.some(
      (campsite) =>
        campsite.availabilities &&
        Object.keys(campsite.availabilities).length > 0
    );

    let datesArray = Array.from(
      new Set(
        campsitesData.flatMap((campsite) =>
          Object.keys(campsite.availabilities || {}).map((date) =>
            date.substring(0, 10)
          )
        )
      )
    ).sort();

    let missingSeason = false;
    if (!hasAnyAvailabilityKeys && campsitesData.length > 0) {
      missingSeason = true;
      const monthAnchorIso =
        startDate ||
        new Date(
          Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth(),
            1,
            0,
            0,
            0,
            0
          )
        ).toISOString();
      datesArray = getUtcDateStringsForMonth(monthAnchorIso);
    }

    const rowDataArray = campsitesData.map((campsite) => {
      const row = {
        campsite: `${campsite.site}`,
        loop: `${campsite.loop}`,
        campsiteObj: campsite,
        id: `${campsite.site}-${campsite.loop}`
      };

      datesArray.forEach((date) => {
        if (missingSeason) {
          row[date] = {
            available: false,
            status: "",
            emptySeasonPlaceholder: true,
          };
          return;
        }
        const status = campsite.availabilities[`${date}T00:00:00Z`];
        row[date] = {
          available: status === "Available" || status === "Open",
          status: status,
        };
      });

      return row;
    });

    return {
      dates: datesArray,
      rowData: rowDataArray,
      missingSeasonDates: missingSeason,
    };
  }, [availabilityData, startDate]);

  const notReservableMap = useMemo(() => {
    const map = new Map();

    if (!dates.length || !rowData.length) return map;
    if (missingSeasonDates) return map;

    rowData.forEach((row) => {
      const isNotReservable = dates.every((date) => {
        const status = row.campsiteObj?.availabilities[`${date}T00:00:00Z`];
        return isNonReservableStatus(status);
      });
      map.set(row.id, isNotReservable);
    });
    return map;
  }, [rowData, dates, missingSeasonDates]);

  const filteredRows = useMemo(() => {
    if (!rowData.length) return [];
    if (!hideNotReservable) return rowData;
    return rowData.filter((row) => !notReservableMap.get(row.id));
  }, [rowData, hideNotReservable, notReservableMap]);

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Natural sort for campsite numbers
      if (sortConfig.key === "campsite") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
          : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortConfig]);

  const selectedCampsiteObjects = useMemo(() => {
    return filteredRows.filter(row => selectedCampsiteIds.has(row.id));
  }, [filteredRows, selectedCampsiteIds]);

  if (!availabilityData || !availabilityData.campsites) {
    return (
      <div className="campground-availability-container explorer-mode">
        <div className="hero-section persistent-stack">
          <div className="hero-container">
            <h1>Campground Availability</h1>
            <p className="description">
              No availability data found. Please go back and try again.
            </p>
          </div>
        </div>
        <div
          className="view-content-area"
          style={{
            padding: "0 1.5rem",
            maxWidth: "1200px",
            margin: "4rem auto",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            className="check-availability-btn"
            style={{ display: "inline-flex" }}
          >
            ← Back to Campsites
          </button>
        </div>
      </div>
    );
  }

  const handleUnavailableClick = (campsite, date) => {
    setSelectedCampsite(campsite);
    setAlertDetails((prev) => ({
      ...prev,
      startDate: date,
      endDate: date,
    }));
    setAlertModal(true);
  };

  const handleSelectChange = async (event) => {
    setSelectedMonth(event.target.value);
    const startDate = new Date(event.target.value);
    const utcDate = new Date(
      Date.UTC(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0)
    );
    setStartDate(utcDate.toISOString());
  };

  const handleMonthChange = async () => {
    setIsLoading(true);
    setSelectedCampsiteIds(new Set());

    try {
      if (!facilityID) {
        throw new Error("Facility ID not found");
      }

      const data = await fetchCampgroundAvailability(facilityID, startDate);
      setAvailabilityData(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching availability data:", error);
      alert("Could not fetch availability. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedCampsiteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCampsiteIds(new Set(filteredRows.map(row => row.id)));
    } else {
      setSelectedCampsiteIds(new Set());
    }
  };

  const handleClearGridSelection = () => {
    setSelectedCampsiteIds(new Set());
  };

  const handleBulkAlertClick = () => {
    if (selectedCampsiteObjects.length === 0) return;

    setAlertDetails((prev) => ({
      ...prev,
      startDate: dates[0],
      endDate: dates[dates.length - 1],
    }));
    setBulkAlertModal(true);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <LuChevronUp className="sort-icon" /> : <LuChevronDown className="sort-icon" />;
  };

  const availabilitySchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Campground Availability Calendar",
    description: "Real-time availability calendar for campground bookings",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      availabilityStarts: startDate,
      availabilityEnds: alertDetails.endDate,
    },
  };

  return (
    <>
      <Helmet>
        <title>
          {facilityName
            ? `${facilityName} - Availability | Kamp Scout`
            : "Campground Availability | Kamp Scout"}
        </title>
        <meta name="theme-color" content="#2b4c1c" />
        <script type="application/ld+json">
          {JSON.stringify(availabilitySchema)}
        </script>
      </Helmet>
      <div className="campground-availability-container explorer-mode">
        {isLoading && <LoadingSpinner fullPage />}

        <div className="hero-section persistent-stack">
          <div className="hero-container">
            <h1>
              {facilityName || "Campground Availability"}
              {facilityState && (
                <span className="state-indicator"> ({facilityState})</span>
              )}
            </h1>
            <p className="description">
              Explore real-time availability and set reservation alerts
            </p>
          </div>
        </div>

        <div className="controls-wrapper persistent-stack">
          <div className="controls-container">
            <div className="availability-card">
              <div className="availability-header">
                <h2>Monthly Campground Availability</h2>
              </div>
              <div className="availability-body">
                <div className="availability-row">
                  <div className="select-container">
                    <LuCalendar className="input-icon" />
                    <select
                      id="month-select"
                      value={selectedMonth}
                      onChange={handleSelectChange}
                      className="month-select"
                      disabled={isLoading}
                      aria-label="Select a month"
                    >
                      <option value="">Select a month...</option>
                      {getNextMonths().map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleMonthChange}
                    className="check-availability-btn"
                    disabled={!selectedMonth || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span style={{ marginLeft: "8px" }}>Loading...</span>
                      </>
                    ) : (
                      "Check"
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="info-text">
              <h3>How to use:</h3>
              <div className="info-content">
                <div className="info-item">
                  <span className="bullet">•</span>
                  <span>
                    Click on any Reserved or Not Yet Released date to create
                    an alert for that date
                  </span>
                </div>
                <div className="info-item">
                  <span className="bullet">•</span>
                  <span>
                    Use checkboxes to select multiple campsites, then click
                    &quot;Create Alert for Selected&quot; to create an alert
                    for them
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="availability-grid-container">
          <div className="availability-legend">
            {missingSeasonDates && (
              <div className="season-dates-info-notification" role="status">
                <p className="season-dates-info-notification__title">
                  Info Notification:
                </p>
                <p className="season-dates-info-notification__body">
                  Campground management has not identified season dates for
                  this period. Please check back soon. Reservation alerts can
                  still be created for monitoring if/when a campsite becomes
                  available.
                </p>
              </div>
            )}
            <span className="legend-item">
              <strong>A</strong> = Available
            </span>
            <span className="legend-item reserved">
              <strong>R</strong> = Reserved
            </span>
            <span className="legend-item not-yet-released">
              <strong>N</strong> = Not Yet Released
            </span>
            <span className="legend-item not-reservable">
              <strong>X</strong> = Not Reservable/Not Available
            </span>
            <div className="legend-controls">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="hideNotReservable"
                  checked={hideNotReservable}
                  onChange={(e) => setHideNotReservable(e.target.checked)}
                />
              </div>
              <label htmlFor="hideNotReservable">
                Hide campsites that are not reservable for all dates
              </label>
            </div>

            {selectedCampsiteIds.size > 0 && (
              <div
                className="availability-selection-bar"
                role="region"
                aria-label="Selected campsites"
              >
                <p
                  className="availability-selection-bar__summary"
                  aria-live="polite"
                >
                  <strong>{selectedCampsiteIds.size}</strong> campsite
                  {selectedCampsiteIds.size !== 1 ? "s" : ""} selected
                </p>
                <div className="availability-selection-bar__actions">
                  <button
                    type="button"
                    className="availability-selection-bar__clear"
                    onClick={handleClearGridSelection}
                  >
                    Clear selection
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkAlertClick}
                    className="bulk-alert-button"
                  >
                    Create Alert for {selectedCampsiteIds.size} Selected
                    Campsite
                    {selectedCampsiteIds.size !== 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="availability-grid-centered-wrapper">
            <div className="modern-availability-table-container">
              <table className="modern-availability-table">
                <thead>
                  <tr>
                    <th className="sticky-col checkbox-col">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={filteredRows.length > 0 && selectedCampsiteIds.size === filteredRows.length}
                      />
                    </th>
                    <th className="sticky-col campsite-col sortable" onClick={() => requestSort("campsite")}>
                      Campsite {renderSortIcon("campsite")}
                    </th>
                    {rowData.some((row) => row.loop) && (
                      <th className="sticky-col loop-col sortable" onClick={() => requestSort("loop")}>
                        Loop {renderSortIcon("loop")}
                      </th>
                    )}
                    {dates.map((date) => (
                      <th key={date} className="date-col">
                        {parseInt(date.substring(5, 7), 10)}/{parseInt(date.substring(8, 10), 10)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <tr key={row.id} className={selectedCampsiteIds.has(row.id) ? "selected-row" : ""}>
                      <td className="sticky-col checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedCampsiteIds.has(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                        />
                      </td>
                      <td className="sticky-col campsite-col">{row.campsite}</td>
                      {rowData.some((r) => r.loop) && (
                        <td className="sticky-col loop-col">{row.loop}</td>
                      )}
                      {dates.map((date) => {
                        const data = row[date];
                        if (!data || data.emptySeasonPlaceholder) {
                          return (
                            <td key={date} className="status-cell season-empty-placeholder">
                              <span
                                className="status-pill season-empty"
                                aria-label="No season dates from campground"
                              />
                            </td>
                          );
                        }

                        let statusClass = "not-reservable";
                        let text = "X";
                        let isClickable = false;
                        let extraClass = "";

                        if (data.available) {
                          statusClass = "available";
                          text = "A";
                          extraClass = "cell-available";
                        } else if (data.status === "Reserved") {
                          statusClass = "reserved";
                          text = "R";
                          isClickable = true;
                          extraClass = "cell-reserved";
                        } else if (data.status === "NYR") {
                          statusClass = "nyr";
                          text = "N";
                          isClickable = true;
                        } else if (isNonReservableStatus(data.status)) {
                          statusClass = "not-reservable";
                          text = "X";
                        } else {
                          // Other unavailable but potentially alertable statuses
                          statusClass = "not-reservable";
                          text = "X";
                          isClickable = true;
                        }

                        return (
                          <td
                            key={date}
                            className={`status-cell status-${statusClass} ${extraClass} ${isClickable ? "clickable-cell" : ""}`}
                            onClick={() => isClickable && handleUnavailableClick(row.campsiteObj, date)}
                          >
                            <span className={`status-pill ${statusClass}`}>{text}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <AlertModal
          isOpen={alertModal}
          onClose={() => setAlertModal(false)}
          title="Availability Alert"
          subtitle={
            selectedCampsite
              ? `Campsite: ${selectedCampsite.site} - ${selectedCampsite.loop}`
              : ""
          }
          alertDetails={alertDetails}
          setAlertDetails={setAlertDetails}
          isCreatingAlert={isCreatingAlert}
          setIsCreatingAlert={setIsCreatingAlert}
          selectedCampsite={selectedCampsite}
          campsiteName={facilityName}
          facilityId={facilityID}
        />

        <AlertModal
          isOpen={bulkAlertModal}
          onClose={() => setBulkAlertModal(false)}
          title="Bulk Availability Alert"
          subtitle={`${selectedCampsiteObjects.length} Campsites Selected`}
          alertDetails={alertDetails}
          setAlertDetails={setAlertDetails}
          isCreatingAlert={isCreatingAlert}
          setIsCreatingAlert={setIsCreatingAlert}
          selectedCampsites={selectedCampsiteObjects.map(r => r.campsiteObj)}
          campsiteName={facilityName}
          isBulkAlert={true}
          facilityId={facilityID}
        />
      </div>
    </>
  );
};

export default CampgroundAvailability;
