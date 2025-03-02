import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampsitesByFacility } from "../../api/campsites";
import { getFacilities } from "../../api/facilities";
import FacilityDetails from "./FacilityDetails";
import FacilityGrid from "./FacilityGrid";
import "./facilities-finder.scss";

const FacilitiesFinder = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const states = [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
    { code: "DC", name: "Washington DC" },
  ];

  const [inputValue, setInputValue] = useState(
    location.state?.searchParams?.query ||
      JSON.parse(localStorage.getItem("searchParams"))?.query ||
      ""
  );
  const [searchParams, setSearchParams] = useState(
    location.state?.searchParams ||
      JSON.parse(localStorage.getItem("searchParams")) || {
        query: "",
      }
  );
  const [facilities, setFacilities] = useState(
    location.state?.facilities ||
      JSON.parse(localStorage.getItem("facilities")) ||
      []
  );
  const [selectedFacility, setSelectedFacility] = useState(
    location.state?.selectedFacility ||
      JSON.parse(localStorage.getItem("selectedFacility")) ||
      null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Filter out empty or undefined parameters
    const updatedSearchParams = Object.fromEntries(
      Object.entries({ ...searchParams, query: inputValue }).filter(
        ([, value]) => value !== "" && value !== null && value !== undefined
      )
    );

    setSearchParams(updatedSearchParams);
    setLoading(true);
    setError("");

    try {
      const response = await getFacilities(updatedSearchParams); // Pass only non-empty params
      const filteredFacilities = response.RECDATA.filter(
        (facility) => facility.FacilityTypeDescription === "Campground"
      );
      setFacilities(filteredFacilities);

      // Save updated searchParams and facilities in localStorage
      localStorage.setItem("searchParams", JSON.stringify(updatedSearchParams));
      localStorage.setItem("facilities", JSON.stringify(response.RECDATA));
    } catch (err) {
      console.error(err);
      setError("Error fetching facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    // Reset inputValue and searchParams to defaults
    setInputValue("");
    setSearchParams({
      query: "",
      state: "",
    });

    // Clear facilities and selected facility
    setFacilities([]);
    setSelectedFacility(null);
    setError("");

    // Remove saved data from localStorage
    localStorage.removeItem("searchParams");
    localStorage.removeItem("facilities");
    localStorage.removeItem("selectedFacility");
  };

  const handleViewCampsites = async () => {
    if (selectedFacility) {
      const response = await fetchCampsitesByFacility(
        selectedFacility.FacilityID
      );
      const campsites = response.RECDATA || [];
      localStorage.setItem(
        "selectedFacility",
        JSON.stringify(selectedFacility)
      );
      navigate("/campsites", {
        state: { campsites, facilityName: selectedFacility.FacilityName },
      });
    }
  };

  const handleRowSelection = (row) => {
    setSelectedFacility(row);
    localStorage.setItem("selectedFacility", JSON.stringify(row));
  };

  useEffect(() => {
    if (!location.state) {
      const savedFacilities = localStorage.getItem("facilities");
      const savedSearchParams = localStorage.getItem("searchParams");
      const savedSelectedFacility = localStorage.getItem("selectedFacility");

      if (savedFacilities) setFacilities(JSON.parse(savedFacilities));
      if (savedSearchParams) setSearchParams(JSON.parse(savedSearchParams));
      if (savedSelectedFacility)
        setSelectedFacility(JSON.parse(savedSelectedFacility));
      setInputValue(JSON.parse(savedSearchParams)?.query || "");
    }

    // Set a session storage flag to detect browser close
    if (!sessionStorage.getItem("isSessionActive")) {
      sessionStorage.setItem("isSessionActive", "true");

      // Clear localStorage from previous sessions
      localStorage.removeItem("searchParams");
      localStorage.removeItem("facilities");
      localStorage.removeItem("selectedFacility");
    }

    // Add event listener for browser/tab close
    const handleUnload = () => {
      localStorage.removeItem("searchParams");
      localStorage.removeItem("facilities");
      localStorage.removeItem("selectedFacility");
    };

    window.addEventListener("beforeunload", handleUnload);

    // Add a visibilitychange event listener as a backup
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // This might be triggered when switching tabs, but also when closing
        sessionStorage.setItem("lastHidden", Date.now().toString());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [location.state]);

  // Second useEffect to check for session resumption
  useEffect(() => {
    // Check if this is a new session by comparing timestamps
    const lastHidden = sessionStorage.getItem("lastHidden");
    const now = Date.now();

    // If returning after more than 5 minutes or no lastHidden (new session)
    // we consider it a new session and clear localStorage
    if (lastHidden && now - parseInt(lastHidden, 10) > 5 * 60 * 1000) {
      localStorage.removeItem("searchParams");
      localStorage.removeItem("facilities");
      localStorage.removeItem("selectedFacility");
      sessionStorage.removeItem("lastHidden");
    }
  }, []);

  return (
    <div className="facilities-finder">
      <div className="header">
        <div className="brand">
          <img src="/kampscout.svg" alt="Kamp Scout Logo" className="logo" />
          <h1>Kamp Scout</h1>
        </div>
        <p className="description">
          Find and explore campgrounds across the United States with ease.
          Search by state or name to discover the perfect spot for your next
          outdoor adventure. If your desired campsite isn&apos;t available, set
          an alert, and we&apos;ll notify you when it opens up!
        </p>
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
            {states.map((state) => (
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

      <div className="grid-row">
        <div className="grid-col">
          <FacilityGrid
            rowData={facilities}
            onRowSelected={handleRowSelection}
          />
        </div>
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
