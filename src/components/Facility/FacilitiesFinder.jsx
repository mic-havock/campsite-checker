import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampsitesByFacility } from "../../api/campsites";
import { getFacilities } from "../../api/facilities";
import { CONTENT } from "../../config/content";
import { STATES } from "../../config/states";
import FacilityDetails from "./FacilityDetails";
import FacilityGrid from "./FacilityGrid";
import "./facilities-finder.scss";

const STORAGE_KEYS = {
  SEARCH_PARAMS: "searchParams",
  FACILITIES: "facilities",
  SELECTED_FACILITY: "selectedFacility",
  SESSION_ACTIVE: "isSessionActive",
  LAST_HIDDEN: "lastHidden",
};

const FacilitiesFinder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasSelectedOnce, setHasSelectedOnce] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchParams, setSearchParams] = useState({ query: "" });
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Storage management functions
  const clearStorage = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (
        key !== STORAGE_KEYS.SESSION_ACTIVE &&
        key !== STORAGE_KEYS.LAST_HIDDEN
      ) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const saveToStorage = useCallback((key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, []);

  const loadFromStorage = useCallback((key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }, []);

  // Event handlers
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const updatedSearchParams = Object.fromEntries(
      Object.entries({ ...searchParams, query: inputValue }).filter(
        ([, value]) => value !== "" && value != null
      )
    );

    setSearchParams(updatedSearchParams);
    setLoading(true);
    setError("");

    try {
      const response = await getFacilities(updatedSearchParams);
      const filteredFacilities = response.RECDATA.filter(
        (facility) => facility.FacilityTypeDescription === "Campground"
      );
      setFacilities(filteredFacilities);
      saveToStorage(STORAGE_KEYS.SEARCH_PARAMS, updatedSearchParams);
      saveToStorage(STORAGE_KEYS.FACILITIES, response.RECDATA);
    } catch (err) {
      console.error(err);
      setError("Error fetching facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSearchParams({ query: "" });
    setFacilities([]);
    setSelectedFacility(null);
    setError("");
    clearStorage();
  };

  const handleViewCampsites = async () => {
    if (!selectedFacility) return;

    try {
      const response = await fetchCampsitesByFacility(
        selectedFacility.FacilityID
      );
      const campsites = response.RECDATA || [];
      saveToStorage(STORAGE_KEYS.SELECTED_FACILITY, selectedFacility);
      navigate("/campsites", {
        state: { campsites, facilityName: selectedFacility.FacilityName },
      });
    } catch (err) {
      console.error(err);
      setError("Error fetching campsites");
    }
  };

  const handleRowSelection = (row) => {
    setSelectedFacility(row);
    saveToStorage(STORAGE_KEYS.SELECTED_FACILITY, row);

    if (!hasSelectedOnce) {
      requestAnimationFrame(() => {
        const gridElement = document.querySelector(".grid-col");
        gridElement?.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      });
      setHasSelectedOnce(true);
    }
  };

  // Session management
  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEYS.SESSION_ACTIVE)) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_ACTIVE, "true");
      clearStorage();
    }

    const handleUnload = () => clearStorage();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sessionStorage.setItem(STORAGE_KEYS.LAST_HIDDEN, Date.now().toString());
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearStorage]);

  // Load saved state
  useEffect(() => {
    if (!location.state) {
      const savedFacilities = loadFromStorage(STORAGE_KEYS.FACILITIES);
      const savedSearchParams = loadFromStorage(STORAGE_KEYS.SEARCH_PARAMS);
      const savedSelectedFacility = loadFromStorage(
        STORAGE_KEYS.SELECTED_FACILITY
      );

      if (savedFacilities) setFacilities(savedFacilities);
      if (savedSearchParams) {
        setSearchParams(savedSearchParams);
        setInputValue(savedSearchParams.query || "");
      }
      if (savedSelectedFacility) setSelectedFacility(savedSelectedFacility);
    }
  }, [location.state, loadFromStorage]);

  // Session timeout check
  useEffect(() => {
    const lastHidden = sessionStorage.getItem(STORAGE_KEYS.LAST_HIDDEN);
    const now = Date.now();

    if (lastHidden && now - parseInt(lastHidden, 10) > 5 * 60 * 1000) {
      clearStorage();
      sessionStorage.removeItem(STORAGE_KEYS.LAST_HIDDEN);
    }
  }, [clearStorage]);

  return (
    <div className="facilities-finder">
      <button
        className="floating-reservation-button"
        onClick={() => navigate("/reservation-management")}
        aria-label="Go to reservation management"
      >
        Manage
        <br />
        Reservation Alerts
      </button>
      <div className="header">
        <div className="brand">
          <img src="/kampscout.svg" alt="Kamp Scout Logo" className="logo" />
        </div>
        <p className="description">{CONTENT.FACILITIES_FINDER.DESCRIPTION}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="facilities-finder__form"
        style={{ width: "100%" }}
      >
        <div className="form-group">
          <input
            id="campground-name"
            name="query"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter campground name"
          />
        </div>
        <div className="form-group">
          <select
            id="state"
            name="state"
            value={searchParams.state}
            onChange={(e) =>
              setSearchParams((prev) => ({
                ...prev,
                state: e.target.value,
              }))
            }
          >
            <option value="">Select a state</option>
            {STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div className="buttons-container">
          <button type="submit" className="submit" disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </button>
          <button type="button" className="clear" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="grid-col">
        <FacilityGrid rowData={facilities} onRowSelected={handleRowSelection} />
      </div>
      {selectedFacility && (
        <FacilityDetails
          facility={selectedFacility}
          handleViewCampsites={handleViewCampsites}
        />
      )}
    </div>
  );
};

export default FacilitiesFinder;
