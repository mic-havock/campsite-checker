import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuFilter } from "react-icons/lu";
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
        <div className="toggle-label-group">
          <LuFilter className="input-icon" />
          <span className="filter-button-text">{getLoopFilterButtonText()}</span>
        </div>
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

const AmenityFilter = ({
  uniqueAmenities,
  selectedAmenities,
  setSelectedAmenities,
  showAmenityFilter,
  setShowAmenityFilter,
  amenityFilterRef,
  dropdownPosition,
  setDropdownPosition,
  title,
  buttonText,
  getAmenityValue,
  getAmenityDisplay,
}) => {
  const handleToggleAmenityFilter = useCallback(() => {
    if (!showAmenityFilter && amenityFilterRef.current) {
      const rect = amenityFilterRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setShowAmenityFilter(!showAmenityFilter);
  }, [showAmenityFilter, amenityFilterRef, setDropdownPosition, setShowAmenityFilter]);

  const toggleAmenitySelection = useCallback(
    (amenity) => {
      const value = getAmenityValue(amenity);
      setSelectedAmenities((prevSelected) => {
        if (prevSelected.includes(value)) {
          return prevSelected.filter((a) => a !== value);
        } else {
          return [...prevSelected, value];
        }
      });
    },
    [setSelectedAmenities, getAmenityValue]
  );

  const clearAllAmenities = useCallback(() => {
    setSelectedAmenities([]);
  }, [setSelectedAmenities]);

  const getAmenityFilterButtonText = useCallback(() => {
    if (selectedAmenities.length > 0) {
      return `${buttonText} (${selectedAmenities.length} selected)`;
    }
    return buttonText;
  }, [selectedAmenities.length, buttonText]);

  if (uniqueAmenities.length === 0) {
    return null;
  }

  return (
    <div className="loop-filter" ref={amenityFilterRef}>
      <button className="loop-filter-toggle" onClick={handleToggleAmenityFilter}>
        <div className="toggle-label-group">
          <LuFilter className="input-icon" />
          <span className="filter-button-text">{getAmenityFilterButtonText()}</span>
        </div>
        <span className="toggle-icon">{showAmenityFilter ? "▲" : "▼"}</span>
      </button>

      {showAmenityFilter && (
        <div
          className="loop-checkbox-container"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="loop-filter-header">
            <p className="loop-filter-info">{title}</p>
            <div className="loop-actions">
              {selectedAmenities.length > 0 && (
                <button className="clear-all-btn" onClick={clearAllAmenities}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="loop-checkbox-list">
            {uniqueAmenities.map((amenity) => {
              const value = getAmenityValue(amenity);
              const display = getAmenityDisplay(amenity);
              return (
                <label key={value} className="loop-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(value)}
                    onChange={() => toggleAmenitySelection(amenity)}
                  />
                  {display}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

AmenityFilter.propTypes = {
  uniqueAmenities: PropTypes.array.isRequired,
  selectedAmenities: PropTypes.array.isRequired,
  setSelectedAmenities: PropTypes.func.isRequired,
  showAmenityFilter: PropTypes.bool.isRequired,
  setShowAmenityFilter: PropTypes.func.isRequired,
  amenityFilterRef: PropTypes.object.isRequired,
  dropdownPosition: PropTypes.object.isRequired,
  setDropdownPosition: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  buttonText: PropTypes.string.isRequired,
  getAmenityValue: PropTypes.func.isRequired,
  getAmenityDisplay: PropTypes.func.isRequired,
};

const CampsiteFilter = ({
  campsiteData,
  setShowReservableOnly,
  showReservableOnly,
  selectedLoops,
  setSelectedLoops,
  selectedAttributes,
  setSelectedAttributes,
  selectedEquipment,
  setSelectedEquipment,
}) => {
  const [showLoopFilter, setShowLoopFilter] = useState(false);
  const [showAttributeFilter, setShowAttributeFilter] = useState(false);
  const [showEquipmentFilter, setShowEquipmentFilter] = useState(false);
  const loopFilterRef = useRef(null);
  const attributeFilterRef = useRef(null);
  const equipmentFilterRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [attributeDropdownPosition, setAttributeDropdownPosition] = useState({ top: 0, left: 0 });
  const [equipmentDropdownPosition, setEquipmentDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        loopFilterRef.current &&
        !loopFilterRef.current.contains(event.target)
      ) {
        setShowLoopFilter(false);
      }
      if (
        attributeFilterRef.current &&
        !attributeFilterRef.current.contains(event.target)
      ) {
        setShowAttributeFilter(false);
      }
      if (
        equipmentFilterRef.current &&
        !equipmentFilterRef.current.contains(event.target)
      ) {
        setShowEquipmentFilter(false);
      }
    };

    if (showLoopFilter || showAttributeFilter || showEquipmentFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLoopFilter, showAttributeFilter, showEquipmentFilter]);

  const uniqueLoops = useMemo(() => {
    if (!campsiteData) return [];
    return [...new Set(campsiteData.map((site) => site.Loop))]
      .filter(Boolean)
      .sort();
  }, [campsiteData]);

  const uniqueAttributes = useMemo(() => {
    if (!campsiteData) return [];
    const attributeSet = new Set();
    campsiteData.forEach((site) => {
      if (site.ATTRIBUTES && Array.isArray(site.ATTRIBUTES)) {
        site.ATTRIBUTES.forEach((attr) => {
          const key = `${attr.AttributeName}::${attr.AttributeValue}`;
          attributeSet.add(key);
        });
      }
    });
    return Array.from(attributeSet)
      .map((key) => {
        const [name, value] = key.split("::");
        const displayName = name.split(/(?=[A-Z])/).join(" ");
        const displayValue = value.split(/(?=[A-Z])/).join(" ");
        return {
          key,
          display: `${displayName}: ${displayValue}`,
          name,
          value,
        };
      })
      .sort((a, b) => a.display.localeCompare(b.display));
  }, [campsiteData]);

  const uniqueEquipment = useMemo(() => {
    if (!campsiteData) return [];
    const equipmentSet = new Set();
    campsiteData.forEach((site) => {
      if (site.PERMITTEDEQUIPMENT && Array.isArray(site.PERMITTEDEQUIPMENT)) {
        site.PERMITTEDEQUIPMENT.forEach((equip) => {
          equipmentSet.add(equip.EquipmentName);
        });
      }
    });
    return Array.from(equipmentSet)
      .map((name) => {
        const display = name.split(/(?=[A-Z])/).join(" ");
        return {
          key: name,
          display,
        };
      })
      .sort((a, b) => a.display.localeCompare(b.display));
  }, [campsiteData]);

  return (
    <div className="unified-controls">
      <div className="controls-header">
        <h2>Filter Campsites</h2>
      </div>

      <div className="controls-body">
        <div className="filter-row">
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

          <AmenityFilter
            uniqueAmenities={uniqueAttributes}
            selectedAmenities={selectedAttributes}
            setSelectedAmenities={setSelectedAttributes}
            showAmenityFilter={showAttributeFilter}
            setShowAmenityFilter={setShowAttributeFilter}
            amenityFilterRef={attributeFilterRef}
            dropdownPosition={attributeDropdownPosition}
            setDropdownPosition={setAttributeDropdownPosition}
            title="Select campsite attributes (electric, accessible, etc.)"
            buttonText="Attributes"
            getAmenityValue={(attr) => attr.key}
            getAmenityDisplay={(attr) => attr.display}
          />

          <AmenityFilter
            uniqueAmenities={uniqueEquipment}
            selectedAmenities={selectedEquipment}
            setSelectedAmenities={setSelectedEquipment}
            showAmenityFilter={showEquipmentFilter}
            setShowAmenityFilter={setShowEquipmentFilter}
            amenityFilterRef={equipmentFilterRef}
            dropdownPosition={equipmentDropdownPosition}
            setDropdownPosition={setEquipmentDropdownPosition}
            title="Select permitted equipment types"
            buttonText="Equipment"
            getAmenityValue={(equip) => equip.key}
            getAmenityDisplay={(equip) => equip.display}
          />

          <label className="reservable-checkbox">
            <input
              type="checkbox"
              checked={showReservableOnly}
              onChange={(e) => setShowReservableOnly(e.target.checked)}
            />
            <span>Show Reservable Only</span>
          </label>
        </div>
      </div>
    </div>
  );
};

CampsiteFilter.propTypes = {
  campsiteData: PropTypes.array.isRequired,
  setShowReservableOnly: PropTypes.func.isRequired,
  showReservableOnly: PropTypes.bool.isRequired,
  selectedLoops: PropTypes.array.isRequired,
  setSelectedLoops: PropTypes.func.isRequired,
  selectedAttributes: PropTypes.array.isRequired,
  setSelectedAttributes: PropTypes.func.isRequired,
  selectedEquipment: PropTypes.array.isRequired,
  setSelectedEquipment: PropTypes.func.isRequired,
};

export default CampsiteFilter;
