import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampgroundAvailability } from "../../api/campsites";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import Campsite from "./Campsite";
import "./campsites-page.scss";

const CampsitesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites, facilityName } = location.state || {};
  const [campsiteData, setCampsiteData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const facilityID = campsites?.[0]?.FacilityID;
  const [isLoading, setIsLoading] = useState(false);
  const [showReservableOnly, setShowReservableOnly] = useState(false);
  const [selectedLoops, setSelectedLoops] = useState([]);
  const [showLoopFilter, setShowLoopFilter] = useState(false);
  const loopFilterRef = useRef(null);

  useEffect(() => {
    if (!campsites || campsites.length === 0) {
      return;
    }

    // Filter out campsites with "Don't Use" in the name and sort the rest alphabetically
    const filteredAndSortedCampsites = campsites
      .filter((campsite) => !campsite.CampsiteName.includes("Don't Use"))
      .sort((a, b) => a.CampsiteName.localeCompare(b.CampsiteName));

    setCampsiteData(filteredAndSortedCampsites);
  }, [campsites]);

  /**
   * Handle click outside of the loop filter dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        loopFilterRef.current &&
        !loopFilterRef.current.contains(event.target)
      ) {
        setShowLoopFilter(false);
      }
    };

    // Add event listener when dropdown is open
    if (showLoopFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLoopFilter]);

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

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const fetchAvailability = async () => {
    if (!selectedMonth) {
      alert("Please select a month.");
      return;
    }

    setIsLoading(true);
    try {
      const startDate = new Date(selectedMonth);
      const utcDate = new Date(
        Date.UTC(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0)
      );

      const data = await fetchCampgroundAvailability(
        facilityID,
        utcDate.toISOString()
      );

      navigate("/reservation-details", {
        state: {
          availabilityData: data,
          facilityID: facilityID,
          campsiteName: facilityName,
        },
      });
    } catch (error) {
      console.error("Error fetching availability data:", error);
      alert("Could not fetch availability. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToMapView = () => {
    if (!campsiteData || campsiteData.length === 0) {
      alert("No campsite data available to display on the map.");
      return;
    }

    navigate("/map-view", {
      state: {
        campsites: campsiteData,
        facilityName: facilityName || "Campground",
      },
    });
  };

  /**
   * Get unique loops from the campsites array
   * @returns {Array} Array of unique loop names
   */
  const getUniqueLoops = () => {
    if (!campsiteData) return [];
    return [...new Set(campsiteData.map((site) => site.Loop))]
      .filter(Boolean)
      .sort();
  };

  /**
   * Toggle a loop selection in the selectedLoops array
   * @param {string} loop - Loop name to toggle
   */
  const toggleLoopSelection = (loop) => {
    setSelectedLoops((prevSelected) => {
      if (prevSelected.includes(loop)) {
        return prevSelected.filter((l) => l !== loop);
      } else {
        return [...prevSelected, loop];
      }
    });
  };

  /**
   * Clear all selected loops
   */
  const clearAllLoops = () => {
    setSelectedLoops([]);
  };

  /**
   * Get the appropriate text for the loop filter toggle button
   * @returns {string} Text to display on the button
   */
  const getLoopFilterButtonText = () => {
    if (selectedLoops.length > 0) {
      return `Loops (${selectedLoops.length} selected)`;
    }
    return "Filter by loop";
  };

  const availableMonths = getNextMonths();
  const uniqueLoops = getUniqueLoops();

  // Filter campsites based on both reservable and loop filters
  const filteredCampsites = campsiteData.filter((campsite) => {
    const reservableMatch = !showReservableOnly || campsite.CampsiteReservable;
    const loopMatch =
      selectedLoops.length === 0 ||
      (campsite.Loop && selectedLoops.includes(campsite.Loop));
    return reservableMatch && loopMatch;
  });

  if (!campsites || campsites.length === 0) {
    return (
      <div className="campsites-page">
        <div className="error-container">
          <h1>No Campsites Available</h1>
          <p>
            There are no campsites available for this facility at the moment.
          </p>
          <button onClick={() => navigate(-1)} className="back-button">
            Back to Campgrounds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campsites-page">
      {isLoading && <LoadingSpinner fullPage />}

      <div className="page-header">
        <h1>{facilityName || "Campground's Campsites"}</h1>
      </div>

      <div className="controls-container">
        <div className="unified-controls">
          <div className="controls-header">
            <h2>Filter Campsites</h2>
            <p className="filtered-count">
              Showing {filteredCampsites.length} of {campsiteData.length} sites
            </p>
          </div>

          <div className="controls-body">
            <div className="filter-options">
              <div className="loop-filter" ref={loopFilterRef}>
                <button
                  className="loop-filter-toggle"
                  onClick={() => setShowLoopFilter(!showLoopFilter)}
                >
                  <span className="filter-button-text">
                    {getLoopFilterButtonText()}
                  </span>
                  <span className="toggle-icon">
                    {showLoopFilter ? "▲" : "▼"}
                  </span>
                </button>

                {showLoopFilter && (
                  <div className="loop-checkbox-container">
                    <div className="loop-filter-header">
                      <p className="loop-filter-info">
                        Select one or more loops to filter campsites
                      </p>
                      <div className="loop-actions">
                        {selectedLoops.length > 0 && (
                          <button
                            className="clear-all-btn"
                            onClick={clearAllLoops}
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="loop-checkbox-list">
                      {uniqueLoops.length > 0 ? (
                        uniqueLoops.map((loop) => (
                          <label key={loop} className="loop-checkbox-item">
                            <input
                              type="checkbox"
                              checked={selectedLoops.includes(loop)}
                              onChange={() => toggleLoopSelection(loop)}
                            />
                            {loop}
                          </label>
                        ))
                      ) : (
                        <p className="no-loops-message">
                          No loop information available
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <label className="reservable-checkbox">
                <input
                  type="checkbox"
                  checked={showReservableOnly}
                  onChange={(e) => setShowReservableOnly(e.target.checked)}
                />
                Show Only Reservable Sites
              </label>
            </div>

            <div className="view-options">
              <button onClick={navigateToMapView} className="view-map-btn">
                View on Map
              </button>
            </div>
          </div>
        </div>

        <div className="availability-card">
          <div className="availability-header">
            <h2>Check Availability</h2>
          </div>
          <div className="availability-body">
            <div className="availability-row">
              <select
                id="month-select"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="month-select"
                disabled={isLoading}
              >
                <option value="">Select a month...</option>
                {availableMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchAvailability}
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
      </div>

      <div className="campsites-grid">
        {filteredCampsites.map((campsite) => (
          <Campsite key={campsite.CampsiteID} campsite={campsite} />
        ))}
      </div>

      <button onClick={() => navigate(-1)} className="back-button">
        <span className="back-arrow">←</span> Back to Campgrounds
      </button>
    </div>
  );
};

export default CampsitesPage;
