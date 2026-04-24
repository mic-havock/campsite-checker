import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { fetchCampsitesByFacility } from "../../api/campsites";
import { getFacilities } from "../../api/facilities";
import { CONTENT } from "../../config/content";
import { STATES } from "../../config/states";

import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";

import FacilityDetails from "./FacilityDetails";
import FacilityGrid from "./FacilityGrid";
import FacilitiesMap from "./Map/FacilitiesMap";
import "./facilities-finder.scss";

const STORAGE_KEYS = {
  SELECTED_FACILITY: "selectedFacility",
  SEARCH_RESULTS: "searchResults",
  SEARCH_PARAMS: "searchParams",
};

const FacilitiesFinder = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "map"

  // Storage management functions
  const clearStorage = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.SELECTED_FACILITY);
    sessionStorage.removeItem(STORAGE_KEYS.SEARCH_RESULTS);
    sessionStorage.removeItem(STORAGE_KEYS.SEARCH_PARAMS);
  }, []);

  const saveToStorage = useCallback((key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }, []);

  // Load from storage on mount
  useEffect(() => {
    const savedResults = sessionStorage.getItem(STORAGE_KEYS.SEARCH_RESULTS);
    const savedParams = sessionStorage.getItem(STORAGE_KEYS.SEARCH_PARAMS);

    if (savedResults && savedParams) {
      setFacilities(JSON.parse(savedResults));
      const params = JSON.parse(savedParams);
      setInputValue(params.query || "");
      setSelectedState(params.state || "");
      setHasSearched(true);
    }
  }, []);

  // Event handlers
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Find the state name if a state code is selected
    const stateInfo = STATES.find((state) => state.code === selectedState);
    const stateName = stateInfo ? stateInfo.name : "";

    // Construct the query with state name if available
    const queryWithState = stateName
      ? `${inputValue} ${stateName}`.trim()
      : inputValue;

    setLoading(true);
    setError("");

    try {
      // First call with just the query
      const response1 = await getFacilities({ query: queryWithState });
      let facilities = response1.RECDATA || [];

      // If state is selected, make second call with both query and state
      if (selectedState) {
        const response2 = await getFacilities({
          query: inputValue,
          state: selectedState,
        });
        const stateFacilities = response2.RECDATA || [];

        // Combine results, removing duplicates based on FacilityID
        const allFacilities = [...facilities, ...stateFacilities];
        const uniqueFacilitiesMap = new Map();
        for (const item of allFacilities) {
          uniqueFacilitiesMap.set(item.FacilityID, item);
        }
        facilities = Array.from(uniqueFacilitiesMap.values());
      }

      setFacilities(facilities);
      setHasSearched(true);
      saveToStorage(STORAGE_KEYS.SEARCH_RESULTS, facilities);
      saveToStorage(STORAGE_KEYS.SEARCH_PARAMS, { query: inputValue, state: selectedState });
    } catch (err) {
      console.error(err);
      setError("Error fetching facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSelectedState("");
    setFacilities([]);
    setSelectedFacility(null);
    setHasSearched(false);
    setError("");
    clearStorage();
  };

  const handleViewCampsites = async () => {
    if (!selectedFacility) return;

    try {
      const response = await fetchCampsitesByFacility(
        selectedFacility.FacilityID,
      );
      const campsites = response.RECDATA || [];
      saveToStorage(STORAGE_KEYS.SELECTED_FACILITY, selectedFacility);
      navigate("/campsites", {
        state: {
          campsites,
          facilityName: selectedFacility.FacilityName,
          facilityState: selectedFacility.FacilityStateCode,
        },
      });
    } catch (err) {
      console.error(err);
      setError("Error fetching campsites");
    }
  };

  const handleRowSelection = (row) => {
    setSelectedFacility(row);

    requestAnimationFrame(() => {
      const detailElement = document.getElementById("facility-details-section");
      if (detailElement) {
        detailElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    });
  };

  const generateCampgroundSchema = (facility) => {
    if (!facility) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Campground",
      name: facility.FacilityName,
      description: facility.FacilityDescription,
      url: `https://kampscout.com/facility/${facility.FacilityID}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: facility.FacilityCity,
        addressRegion: facility.FacilityStateCode,
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: facility.FacilityLatitude,
        longitude: facility.FacilityLongitude,
      },
      amenityFeature: (facility.FACILITYADDRESS || []).map((address) => ({
        "@type": "LocationFeatureSpecification",
        name: address.AddressType,
        value: true,
      })),
    };
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KampScout",
    url: "https://kampscout.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://kampscout.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
        {selectedFacility && (
          <script type="application/ld+json">
            {JSON.stringify(generateCampgroundSchema(selectedFacility))}
          </script>
        )}
      </Helmet>
      <div className="facilities-finder">
        <div className="hero-section">
          <div className="hero-top-bar">
            <button
              className="alert-management-btn"
              onClick={() => navigate("/reservation-management")}
              aria-label="Go to reservation management"
            >
              Manage Reservation Alerts
            </button>
          </div>
          <div className="hero-content">
            <div className="brand">
              <img src="/kampscout.svg" alt="Kamp Scout Logo" className="logo" />
            </div>
            <p className="description">{CONTENT.FACILITIES_FINDER.DESCRIPTION}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="facilities-finder__form">
          <div className="form-group">
            <input
              id="campground-name"
              name="query"
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Search terms..."
            />
          </div>
          <div className="form-group">
            <select
              id="state"
              name="state"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
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
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <LoadingSpinner size="small" />
                  <span>Loading...</span>
                </div>
              ) : (
                "Search"
              )}
            </button>
            <button type="button" className="clear" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}

        {hasSearched && (
          <>
            {facilities && facilities.length > 0 ? (
              <>
                <div className="view-toggle-container">
                  <button
                    className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => setViewMode("grid")}
                  >
                    Table View
                  </button>
                  <button
                    className={`view-toggle-btn ${viewMode === "map" ? "active" : ""}`}
                    onClick={() => setViewMode("map")}
                  >
                    Map View
                  </button>
                </div>

                <div className="results-container">
                  {viewMode === "grid" && (
                    <div className="grid-col">
                      <FacilityGrid
                        rowData={facilities}
                        onRowSelected={handleRowSelection}
                        selectedState={
                          selectedState
                            ? STATES.find((state) => state.code === selectedState)
                            : null
                        }
                      />
                    </div>
                  )}
                  {viewMode === "map" && (
                    <div className="map-col">
                      <FacilitiesMap
                        facilities={facilities}
                        onFacilitySelect={handleRowSelection}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              !loading && (
                <div className="no-results">
                  <p>No campgrounds found for your search. Try different terms or another state.</p>
                </div>
              )
            )}
          </>
        )}

        {selectedFacility && (
          <FacilityDetails
            facility={selectedFacility}
            handleViewCampsites={handleViewCampsites}
          />
        )}
      </div>
    </>
  );
};

export default FacilitiesFinder;
