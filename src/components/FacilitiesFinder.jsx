import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampsitesByFacility } from "../api/campsites";
import { getFacilities } from "../api/facilities";
import FacilityDetails from "./Facility/FacilityDetails";
import FacilityGrid from "./Facility/FacilityGrid";

const FacilitiesFinder = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Restore state from location or localStorage
  const [inputValue, setInputValue] = useState(
    location.state?.searchParams?.query ||
      JSON.parse(localStorage.getItem("searchParams"))?.query ||
      ""
  );
  const [searchParams, setSearchParams] = useState(
    location.state?.searchParams ||
      JSON.parse(localStorage.getItem("searchParams")) || {
        activity: "",
        sort: "",
        limit: 500,
        offset: 0,
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
    setInputValue(e.target.value); // Update the input value
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); // Prevent default for form submission
    const updatedSearchParams = { ...searchParams, query: inputValue };
    setSearchParams(updatedSearchParams);
    setLoading(true);
    setError("");

    try {
      const response = await getFacilities(inputValue); // Fetch facilities
      setFacilities(response.RECDATA);

      // Persist state to localStorage
      localStorage.setItem("searchParams", JSON.stringify(updatedSearchParams));
      localStorage.setItem("facilities", JSON.stringify(response.RECDATA));
    } catch (err) {
      console.error(err);
      setError("Error fetching facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCampsites = async () => {
    if (selectedFacility) {
      const response = await fetchCampsitesByFacility(
        selectedFacility.FacilityID
      );
      const campsites = response.RECDATA || [];
      // Persist selected facility to localStorage
      localStorage.setItem(
        "selectedFacility",
        JSON.stringify(selectedFacility)
      );
      navigate("/campsites", {
        state: { campsites },
      });
    }
  };

  const handleRowSelection = (row) => {
    setSelectedFacility(row);
    localStorage.setItem("selectedFacility", JSON.stringify(row)); // Persist selection
  };

  useEffect(() => {
    // If there's no location state but localStorage has data, restore it
    if (!location.state) {
      const savedFacilities = localStorage.getItem("facilities");
      const savedSearchParams = localStorage.getItem("searchParams");
      const savedSelectedFacility = localStorage.getItem("selectedFacility");

      if (savedFacilities) setFacilities(JSON.parse(savedFacilities));
      if (savedSearchParams) setSearchParams(JSON.parse(savedSearchParams));
      if (savedSelectedFacility)
        setSelectedFacility(JSON.parse(savedSelectedFacility));
      setInputValue(
        JSON.parse(savedSearchParams)?.query || "" // Restore input value
      );
    }
  }, [location.state]);

  return (
    <div>
      {/* Search Form */}
      <form onSubmit={handleSubmit}>
        <label>
          Facility Name:
          <input
            type="text"
            name="query"
            value={inputValue} // Use the input value for rendering
            onChange={handleInputChange} // Update the input value
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </form>

      {/* Error Display */}
      {error && <p>{error}</p>}

      {/* Facility Grid and Details */}
      <FacilityGrid rowData={facilities} onRowSelected={handleRowSelection} />
      {selectedFacility && <FacilityDetails facility={selectedFacility} />}

      {/* View Campgrounds Button */}
      <button
        onClick={handleViewCampsites}
        disabled={!selectedFacility}
        style={{ marginTop: "10px" }}
      >
        View Campgrounds
      </button>
    </div>
  );
};

export default FacilitiesFinder;
