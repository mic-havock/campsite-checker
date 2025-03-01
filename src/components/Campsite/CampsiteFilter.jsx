import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import "./campsite-filter.scss";

/**
 * Component for filtering campsites by loop and reservable status
 * @param {Object} props - Component props
 * @param {Array} props.campsiteData - Array of campsite data
 * @param {Array} props.filteredCampsites - Array of filtered campsite data
 * @param {Function} props.setShowReservableOnly - Function to update reservable only filter
 * @param {boolean} props.showReservableOnly - Whether to show only reservable campsites
 * @param {Array} props.selectedLoops - Array of selected loop names
 * @param {Function} props.setSelectedLoops - Function to update selected loops
 */
const CampsiteFilter = ({
  campsiteData,
  filteredCampsites,
  setShowReservableOnly,
  showReservableOnly,
  selectedLoops,
  setSelectedLoops,
}) => {
  const [showLoopFilter, setShowLoopFilter] = useState(false);
  const loopFilterRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

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
   * Calculate and set the position of the dropdown when it opens
   */
  const handleToggleLoopFilter = () => {
    if (!showLoopFilter && loopFilterRef.current) {
      const rect = loopFilterRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setShowLoopFilter(!showLoopFilter);
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

  const uniqueLoops = getUniqueLoops();

  return (
    <div className="unified-controls">
      <div className="controls-header">
        <h2>Filter Campsites</h2>
      </div>

      <div className="controls-body">
        <div className="filter-options">
          <div className="loop-filter" ref={loopFilterRef}>
            <button
              className="loop-filter-toggle"
              onClick={handleToggleLoopFilter}
            >
              <span className="filter-button-text">
                {getLoopFilterButtonText()}
              </span>
              <span className="toggle-icon">{showLoopFilter ? "▲" : "▼"}</span>
            </button>

            {showLoopFilter && (
              <div
                className="loop-checkbox-container"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                }}
              >
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
        <p className="filtered-count">
          Showing {filteredCampsites.length} of {campsiteData.length} sites
        </p>
      </div>
    </div>
  );
};

CampsiteFilter.propTypes = {
  campsiteData: PropTypes.array.isRequired,
  filteredCampsites: PropTypes.array.isRequired,
  setShowReservableOnly: PropTypes.func.isRequired,
  showReservableOnly: PropTypes.bool.isRequired,
  selectedLoops: PropTypes.array.isRequired,
  setSelectedLoops: PropTypes.func.isRequired,
};

export default CampsiteFilter;
