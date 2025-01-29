import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampgroundAvailability } from "../../api/campsites";
import Campsite from "./Campsite";
import "./campsites-page.scss";

const CampsitesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites } = location.state || {}; // Access campsites
  const [selectedDate, setSelectedDate] = useState("");
  // Get facilityId from the first campsite if available
  const facilityID = campsites?.[0]?.FacilityID;
  console.log(JSON.stringify(campsites, null, 2));
  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const fetchAvailability = async () => {
    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }

    try {
      const selectedDateObj = new Date(selectedDate);
      const startDate = new Date(
        Date.UTC(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1)
      ).toISOString();

      //const startDate = new Date(selectedDate).toISOString();
      const data = await await fetchCampgroundAvailability(
        facilityID,
        startDate
      );

      navigate("/reservation-details", { state: { availabilityData: data } });
    } catch (error) {
      console.error("Error fetching availability data:", error);
      alert("Could not fetch availability. Please try again later.");
    }
  };

  return (
    <div>
      <h1>Campground&apos;s Campsites</h1>
      <div className="availability-check">
        <input type="date" value={selectedDate} onChange={handleDateChange} />
        <button onClick={fetchAvailability}>Check Availability</button>
      </div>
      {campsites && campsites.length > 0 ? (
        <div className="campsites-grid">
          {campsites.map((campsite) => (
            <Campsite key={campsite.CampsiteID} campsite={campsite} />
          ))}
        </div>
      ) : (
        <p>No campsites available for this facility.</p>
      )}
      <button onClick={() => navigate(-1)}>Back to Campgrounds</button>
    </div>
  );
};

export default CampsitesPage;
