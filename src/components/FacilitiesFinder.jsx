import {
  Button,
  Grid,
  GridContainer,
  TextInput,
} from "@trussworks/react-uswds";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampsitesByFacility } from "../api/campsites";
import { getFacilities } from "../api/facilities";
import FacilityDetails from "./Facility/FacilityDetails";
import FacilityGrid from "./Facility/FacilityGrid";
import "./facilities-finder.scss";

const FacilitiesFinder = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const updatedSearchParams = { ...searchParams, query: inputValue };
    setSearchParams(updatedSearchParams);
    setLoading(true);
    setError("");

    try {
      const response = await getFacilities(inputValue);
      setFacilities(response.RECDATA);

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
    setInputValue("");
    setFacilities([]);
    setSelectedFacility(null);
    setError("");

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
        state: { campsites },
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
  }, [location.state]);

  return (
    <GridContainer className="facilities-finder">
      <h1>Find Your Perfect Campground</h1>
      <form onSubmit={handleSubmit} className="facilities-finder__form">
        <TextInput
          id="campground-name"
          name="query"
          type="text"
          label="Campground Name"
          value={inputValue}
          onChange={handleInputChange}
        />
        <Button type="submit" className="submit" disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </Button>
        <Button type="button" className="clear" onClick={handleClear}>
          Clear
        </Button>
      </form>

      {error && <p className="error">{error}</p>}

      <Grid row>
        <Grid col={12}>
          <FacilityGrid
            rowData={facilities}
            onRowSelected={handleRowSelection}
          />
        </Grid>
      </Grid>
      {selectedFacility && <FacilityDetails facility={selectedFacility} />}

      <Button
        onClick={handleViewCampsites}
        className="view-campgrounds"
        disabled={!selectedFacility}
      >
        View Campgrounds
      </Button>
    </GridContainer>
  );
};

export default FacilitiesFinder;
