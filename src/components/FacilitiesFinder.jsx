import { useState } from "react";
import { getFacilities } from "../api/facilities";
import FacilityGrid from "./FacilityGrid";

const FacilitiesFinder = () => {
  const [searchParams, setSearchParams] = useState({
    activity: "",
    sort: "",
    limit: 500,
    offset: 0,
  });
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prevParams) => ({
      ...prevParams,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await getFacilities(searchParams.query);
      setFacilities(response.RECDATA);
    } catch (err) {
      console.error(err);
      setError("Error fetching facilities");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input
            type="text"
            name="query"
            value={searchParams.query}
            onChange={handleInputChange}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </form>

      {error && <p>{error}</p>}

      <FacilityGrid rowData={facilities} />
    </div>
  );
};

export default FacilitiesFinder;
