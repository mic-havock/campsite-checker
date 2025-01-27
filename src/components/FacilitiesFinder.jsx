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
      console.log("Filtered searchParams", updatedSearchParams);
      const response = await getFacilities(updatedSearchParams); // Pass only non-empty params
      setFacilities(response.RECDATA);

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
      limit: "",
      offset: 0,
      latitude: "",
      longitude: "",
      radius: "",
      activity: "",
      lastupdated: "",
      sort: "",
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
      <h1>Recreation Information Database (RIDB)</h1>
      <h1>Facility Finder</h1>
      <form onSubmit={handleSubmit} className="facilities-finder__form">
        <div className="form-group">
          <TextInput
            id="campground-name"
            name="query"
            type="text"
            label="Campground Name"
            value={inputValue}
            onChange={handleInputChange}
          />
          <p className="helper-text">
            Enter the name of the campground or facility.
          </p>
        </div>
        <div className="form-group">
          {/* <label htmlFor="state">State</label> */}
          <select
            id="state"
            name="state"
            value={searchParams.state}
            onChange={(e) =>
              setSearchParams((prev) => ({ ...prev, state: e.target.value }))
            }
            className="dropdown"
          >
            <option value="">Select a state</option>
            {states.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
          <p className="helper-text">Select the two-letter state code.</p>
        </div>
        <div className="form-group">
          <TextInput
            id="latitude"
            name="latitude"
            type="number"
            label="Latitude"
            value={searchParams.latitude}
            onChange={(e) =>
              setSearchParams((prev) => ({ ...prev, latitude: e.target.value }))
            }
          />
          <p className="helper-text">
            Enter the latitude for location-based filtering.
          </p>
        </div>
        <div className="form-group">
          <TextInput
            id="longitude"
            name="longitude"
            type="number"
            label="Longitude"
            value={searchParams.longitude}
            onChange={(e) =>
              setSearchParams((prev) => ({
                ...prev,
                longitude: e.target.value,
              }))
            }
          />
          <p className="helper-text">
            Enter the longitude for location-based filtering.
          </p>
        </div>
        <div className="form-group">
          <TextInput
            id="radius"
            name="radius"
            type="number"
            label="Radius (miles)"
            value={searchParams.radius}
            onChange={(e) =>
              setSearchParams((prev) => ({ ...prev, radius: e.target.value }))
            }
          />
          <p className="helper-text">Specify the search radius in miles.</p>
        </div>
        {/* <div className="form-group">
              <TextInput
                id="limit"
                name="limit"
                type="number"
                label="Limit"
                value={searchParams.limit}
                onChange={(e) =>
                  setSearchParams((prev) => ({ ...prev, limit: e.target.value }))
                }
              />
              <p className="helper-text">
                Specify the maximum number of results to display.
              </p>
            </div> */}
        {/* <div className="form-group">
              <TextInput
                id="offset"
                name="offset"
                type="number"
                label="Offset"
                value={searchParams.offset}
                onChange={(e) =>
                  setSearchParams((prev) => ({ ...prev, offset: e.target.value }))
                }
              />
              <p className="helper-text">
                Set the starting point for results pagination.
              </p>
            </div> */}
        {/* <div className="form-group">
          <TextInput
            id="activity"
            name="activity"
            type="text"
            label="Activity"
            value={searchParams.activity}
            onChange={(e) =>
              setSearchParams((prev) => ({ ...prev, activity: e.target.value }))
            }
          />
          <p className="helper-text">
            Enter the activity type (e.g., CAMPING, FISHING).
          </p>
        </div> */}
        {/* <div className="form-group">
          <TextInput
            id="lastupdated"
            name="lastupdated"
            type="date"
            label="Last Updated"
            value={searchParams.lastupdated}
            onChange={(e) =>
              setSearchParams((prev) => ({
                ...prev,
                lastupdated: e.target.value,
              }))
            }
          />
          <p className="helper-text">
            Filter facilities updated after this date.
          </p>
        </div> */}
        {/* <div className="form-group">
          <TextInput
            id="sort"
            name="sort"
            type="text"
            label="Sort By"
            value={searchParams.sort}
            onChange={(e) =>
              setSearchParams((prev) => ({ ...prev, sort: e.target.value }))
            }
          />
          <p className="helper-text">
            Specify sorting order (e.g., NAME, DATE).
          </p>
        </div> */}
        <Grid col={12}>
          <Button type="submit" className="submit" disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </Button>
          <Button type="button" className="clear" onClick={handleClear}>
            Clear
          </Button>
        </Grid>
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
      {selectedFacility && (
        <FacilityDetails
          facility={selectedFacility}
          handleViewCampsites={handleViewCampsites} // Pass the function here
        />
      )}

      {/* <Button
        onClick={handleViewCampsites}
        className="view-campgrounds"
        disabled={!selectedFacility}
      >
        View Campgrounds
      </Button> */}
    </GridContainer>
  );
};

export default FacilitiesFinder;
