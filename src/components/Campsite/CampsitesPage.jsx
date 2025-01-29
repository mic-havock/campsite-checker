import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCampgroundAvailability } from "../../api/campsites";
import Campsite from "./Campsite";
import "./campsites-page.scss";

const CampsitesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites, facilityName } = location.state || {};
  const [selectedMonth, setSelectedMonth] = useState("");
  const facilityID = campsites?.[0]?.FacilityID;
  const [isLoading, setIsLoading] = useState(false);

  const getNextMonths = () => {
    const months = [];
    const currentDate = new Date();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    for (let i = 0; i < 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1
      );

      const monthName = monthNames[date.getMonth()];
      const year = date.getFullYear();

      months.push({
        value: date.toISOString(),
        label: `${monthName} ${year}`,
        month: monthName,
        year: year,
      });
    }
    return months;
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const fetchAvailability = async () => {
    if (!selectedMonth) {
      alert("Please select a month.");
      return;
    }

    setIsLoading(true);
    try {
      const startDate = new Date(selectedMonth);
      const utcDate = new Date(
        Date.UTC(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0)
      );

      const data = await fetchCampgroundAvailability(
        facilityID,
        utcDate.toISOString()
      );

      navigate("/reservation-details", { state: { availabilityData: data } });
    } catch (error) {
      console.error("Error fetching availability data:", error);
      alert("Could not fetch availability. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const availableMonths = getNextMonths();
  const selectedMonthData = availableMonths.find(
    (m) => m.value === selectedMonth
  );

  if (!campsites || campsites.length === 0) {
    return (
      <div className="campsites-page">
        <div className="error-container">
          <h1>No Campsites Available</h1>
          <p>
            There are no campsites available for this facility at the moment.
          </p>
          <button onClick={() => navigate(-1)} className="back-button">
            Back to Campgrounds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campsites-page">
      <div className="page-header">
        <h1>{facilityName || "Campground's Campsites"}</h1>
        <p className="campsite-count">
          {campsites.length} {campsites.length === 1 ? "campsite" : "campsites"}{" "}
          available
        </p>
      </div>

      <div className="availability-section">
        <div className="month-picker">
          <label htmlFor="month-select">Select Month for Availability</label>
          <div className="select-wrapper">
            <select
              id="month-select"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="month-select"
            >
              <option value="">Choose a month...</option>
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchAvailability}
            className="check-availability-btn"
            disabled={!selectedMonth || isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner">Loading...</span>
            ) : selectedMonthData ? (
              `Check ${selectedMonthData.month} Availability`
            ) : (
              "Check Availability"
            )}
          </button>
        </div>
      </div>

      <div className="campsites-grid">
        {campsites.map((campsite) => (
          <Campsite key={campsite.CampsiteID} campsite={campsite} />
        ))}
      </div>

      <button onClick={() => navigate(-1)} className="back-button">
        <span className="back-arrow">←</span> Back to Campgrounds
      </button>
    </div>
  );
};

export default CampsitesPage;
