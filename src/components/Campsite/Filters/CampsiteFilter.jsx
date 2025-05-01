import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./campsite-filter.scss";

const LoopFilter = ({
  uniqueLoops,
  selectedLoops,
  setSelectedLoops,
  showLoopFilter,
  setShowLoopFilter,
  loopFilterRef,
  dropdownPosition,
  setDropdownPosition,
}) => {
  const handleToggleLoopFilter = useCallback(() => {
    if (!showLoopFilter && loopFilterRef.current) {
      const rect = loopFilterRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setShowLoopFilter(!showLoopFilter);
  }, [showLoopFilter, loopFilterRef, setDropdownPosition, setShowLoopFilter]);

  const toggleLoopSelection = useCallback(
    (loop) => {
      setSelectedLoops((prevSelected) => {
        if (prevSelected.includes(loop)) {
          return prevSelected.filter((l) => l !== loop);
        } else {
          return [...prevSelected, loop];
        }
      });
    },
    [setSelectedLoops]
  );

  const clearAllLoops = useCallback(() => {
    setSelectedLoops([]);
  }, [setSelectedLoops]);

  const getLoopFilterButtonText = useCallback(() => {
    if (selectedLoops.length > 0) {
      return `Loops (${selectedLoops.length} selected)`;
    }
    return "Filter by loop";
  }, [selectedLoops.length]);

  return (
    <div className="loop-filter" ref={loopFilterRef}>
      <button className="loop-filter-toggle" onClick={handleToggleLoopFilter}>
        <span className="filter-button-text">{getLoopFilterButtonText()}</span>
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
              <p className="no-loops-message">No loop information available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

LoopFilter.propTypes = {
  uniqueLoops: PropTypes.array.isRequired,
  selectedLoops: PropTypes.array.isRequired,
  setSelectedLoops: PropTypes.func.isRequired,
  showLoopFilter: PropTypes.bool.isRequired,
  setShowLoopFilter: PropTypes.func.isRequired,
  loopFilterRef: PropTypes.object.isRequired,
  dropdownPosition: PropTypes.object.isRequired,
  setDropdownPosition: PropTypes.func.isRequired,
};

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        loopFilterRef.current &&
        !loopFilterRef.current.contains(event.target)
      ) {
        setShowLoopFilter(false);
      }
    };

    if (showLoopFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLoopFilter]);

  const uniqueLoops = useMemo(() => {
    if (!campsiteData) return [];
    return [...new Set(campsiteData.map((site) => site.Loop))]
      .filter(Boolean)
      .sort();
  }, [campsiteData]);

  return (
    <div className="unified-controls">
      <div className="controls-header">
        <h2>Filter Campsites</h2>
      </div>

      <div className="controls-body">
        <div className="filter-options">
          <LoopFilter
            uniqueLoops={uniqueLoops}
            selectedLoops={selectedLoops}
            setSelectedLoops={setSelectedLoops}
            showLoopFilter={showLoopFilter}
            setShowLoopFilter={setShowLoopFilter}
            loopFilterRef={loopFilterRef}
            dropdownPosition={dropdownPosition}
            setDropdownPosition={setDropdownPosition}
          />

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
