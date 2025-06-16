import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampsitesByFacility } from "../../api/campsites";
import { getFacilities } from "../../api/facilities";
import { CONTENT } from "../../config/content";
import { STATES } from "../../config/states";
import FacilityDetails from "./FacilityDetails";
import FacilityGrid from "./FacilityGrid";
import "./facilities-finder.scss";

const STORAGE_KEYS = {
  SELECTED_FACILITY: "selectedFacility",
};

const FacilitiesFinder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputValue, setInputValue] = useState("");
  const [searchParams, setSearchParams] = useState({ query: "" });
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Storage management functions
  const clearStorage = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.SELECTED_FACILITY);
  }, []);

  const saveToStorage = useCallback((key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }, []);

  const loadFromStorage = useCallback((key) => {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }, []);

  // Event handlers
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Find the state name if a state code is selected
    const selectedState = STATES.find(
      (state) => state.code === searchParams.state
    );
    const stateName = selectedState ? selectedState.name : "";

    // Construct the query with state name if available
    const queryWithState = stateName
      ? `${inputValue} ${stateName}`.trim()
      : inputValue;

    // Keep state in local search params for filtering
    const updatedSearchParams = {
      ...searchParams,
      query: queryWithState,
    };

    setSearchParams(updatedSearchParams);
    setLoading(true);
    setError("");

    try {
      // First call with just the query
      const response1 = await getFacilities({ query: queryWithState });
      let facilities = response1.RECDATA || [];

      // If state is selected, make second call with both query and state
      if (searchParams.state) {
        const response2 = await getFacilities({
          query: inputValue,
          state: searchParams.state,
        });
        const stateFacilities = response2.RECDATA || [];

        // Combine results, removing duplicates based on FacilityID
        const allFacilities = [...facilities, ...stateFacilities];
        const uniqueFacilities = Array.from(
          new Map(allFacilities.map((item) => [item.FacilityID, item])).values()
        );
        facilities = uniqueFacilities;
      }

      setFacilities(facilities);
    } catch (err) {
      console.error(err);
      setError("Error fetching facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSearchParams({ query: "", state: "" });
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

    requestAnimationFrame(() => {
      const gridElement = document.querySelector(".grid-col");
      gridElement?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    });
  };

  useEffect(() => {
    if (!location.state) {
      const savedSelectedFacility = loadFromStorage(
        STORAGE_KEYS.SELECTED_FACILITY
      );
      if (savedSelectedFacility) setSelectedFacility(savedSelectedFacility);
    }
  }, [location.state, loadFromStorage]);

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
      amenityFeature: facility.FACILITYADDRESS.map((address) => ({
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
              value={searchParams.state || ""}
              onChange={(e) => {
                setSearchParams((prev) => ({
                  ...prev,
                  state: e.target.value,
                }));
              }}
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
          <FacilityGrid
            rowData={facilities}
            onRowSelected={handleRowSelection}
            selectedState={
              searchParams.state
                ? STATES.find((state) => state.code === searchParams.state)
                : null
            }
          />
        </div>
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
