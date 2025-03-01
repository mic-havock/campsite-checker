import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import CampsiteMap from "./CampsiteMap";
import "./map-view.scss";

/**
 * MapView component displays a dedicated page with a map of campsite locations
 *
 * @returns {JSX.Element} - Rendered component
 */
const MapView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites, facilityName } = location.state || {};
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReservableOnly, setShowReservableOnly] = useState(false);
  const [selectedLoops, setSelectedLoops] = useState([]);
  const [showLoopFilter, setShowLoopFilter] = useState(false);
  const [filteredCampsites, setFilteredCampsites] = useState([]);
  const loopFilterRef = useRef(null);

  useEffect(() => {
    // Check if we have the required data
    if (!campsites || !Array.isArray(campsites) || campsites.length === 0) {
      setError("No campsite data available. Please go back and try again.");
      setIsLoading(false);
      return;
    }

    // Initialize filtered campsites with all campsites
    setFilteredCampsites(campsites);

    // Simulate loading for map resources
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
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

  /**
   * Apply filters to the campsites based on selected loops and reservable status
   */
  useEffect(() => {
    if (!campsites) return;

    const filtered = campsites.filter((campsite) => {
      const reservableMatch =
        !showReservableOnly || campsite.CampsiteReservable;

      // If no loops are selected, show all loops
      // Otherwise, check if the campsite's loop is in the selected loops array
      const loopMatch =
        selectedLoops.length === 0 ||
        (campsite.Loop && selectedLoops.includes(campsite.Loop));

      return reservableMatch && loopMatch;
    });

    setFilteredCampsites(filtered);
  }, [campsites, showReservableOnly, selectedLoops]);

  /**
   * Get unique loops from the campsites array
   * @returns {Array} Array of unique loop names
   */
  const getUniqueLoops = () => {
    if (!campsites) return [];
    return [...new Set(campsites.map((site) => site.Loop))]
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

  const uniqueLoops = getUniqueLoops();

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (error) {
    return (
      <div className="map-view-page">
        <div className="error-container">
          <h1>Error Loading Map</h1>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-button">
            <span className="back-arrow">←</span> Back to Campsites
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="map-view-page">
      <div className="map-view-header">
        <h1>{facilityName || "Campground"} - Campsite Map</h1>
        <p className="campsite-count">
          {filteredCampsites.length} of {campsites.length}{" "}
          {campsites.length === 1 ? "Campsite" : "Campsites"} displayed
        </p>
      </div>

      <div className="map-filters">
        <div className="filter-container">
          <div className="loop-filter" ref={loopFilterRef}>
            <button
              className="loop-filter-toggle"
              onClick={() => setShowLoopFilter(!showLoopFilter)}
            >
              <span className="filter-button-text">
                {getLoopFilterButtonText()}
              </span>
              <span className="toggle-icon">{showLoopFilter ? "▲" : "▼"}</span>
            </button>

            {showLoopFilter && (
              <div className="loop-checkbox-container">
                <div className="loop-filter-header">
                  <p className="loop-filter-info">
                    Select one or more loops to filter campsites
                  </p>
                  <div className="loop-actions">
                    {selectedLoops.length > 0 && (
                      <button className="clear-all-btn" onClick={clearAllLoops}>
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
      </div>

      <div className="map-container">
        <CampsiteMap
          campsites={filteredCampsites}
          facilityName={facilityName || "Campground"}
        />
      </div>

      <div className="map-view-footer">
        <button onClick={() => navigate(-1)} className="back-button">
          <span className="back-arrow">←</span> Back to Campsites
        </button>
      </div>
    </div>
  );
};

export default MapView;
