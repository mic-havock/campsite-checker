import React, { useState } from "react";
import { fetchCampgroundAvailability, fetchCampsiteAvailability } from "../api/campsites";

const CampsiteChecker = () => {
  const [campgroundId, setCampgroundId] = useState("");
  const [campsiteId, setCampsiteId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleCheckCampground = async () => {
    try {
      setError("");
      const data = await fetchCampgroundAvailability(campgroundId, startDate);
      setResults(data);
    } catch (err) {
      setError("Error fetching campground availability. Check console for details.");
    }
  };

  const handleCheckCampsite = async () => {
    try {
      setError("");
      const data = await fetchCampsiteAvailability(campsiteId);
      setResults(data);
    } catch (err) {
      setError("Error fetching campsite availability. Check console for details.");
    }
  };

  return (
    <div>
      <h1>Campsite Checker</h1>

      <div>
        <h2>Check Campground Availability</h2>
        <input
          type="text"
          placeholder="Campground ID"
          value={campgroundId}
          onChange={(e) => setCampgroundId(e.target.value)}
        />
        <input
          type="date"
          placeholder="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <button onClick={handleCheckCampground}>Check Campground</button>
      </div>

      <div>
        <h2>Check Specific Campsite Availability</h2>
        <input
          type="text"
          placeholder="Campsite ID"
          value={campsiteId}
          onChange={(e) => setCampsiteId(e.target.value)}
        />
        <button onClick={handleCheckCampsite}>Check Campsite</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {results && (
        <div>
          <h3>Results:</h3>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CampsiteChecker;
