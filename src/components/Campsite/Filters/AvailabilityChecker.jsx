import PropTypes from "prop-types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCampgroundAvailability } from "../../../api/campsites";
import LoadingSpinner from "../../Common/LoadingSpinner/LoadingSpinner";
import "./availability-checker.scss";

const MONTH_NAMES = [
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

const getNextMonthsFromDate = (currentDate) => {
  const months = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1
    );

    const monthName = MONTH_NAMES[date.getMonth()];
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

//Component for checking campsite availability for a selected month
const AvailabilityChecker = ({ facilityID, facilityName, setIsLoading }) => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
    setError("");
  };

  const fetchAvailability = async () => {
    if (!selectedMonth) {
      setError("Please select a month.");
      return;
    }

    setLocalLoading(true);
    setIsLoading(true);
    setError("");

    try {
      const startDate = new Date(selectedMonth);
      const utcDate = new Date(
        Date.UTC(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0)
      );

      const data = await fetchCampgroundAvailability(
        facilityID,
        utcDate.toISOString()
      );

      navigate("/reservation-details", {
        state: {
          availabilityData: data,
          facilityID: facilityID,
          campsiteName: facilityName,
        },
      });
    } catch (error) {
      console.error("Error fetching availability data:", error);
      setError("Could not fetch availability. Please try again later.");
    } finally {
      setLocalLoading(false);
      setIsLoading(false);
    }
  };

  const availableMonths = getNextMonthsFromDate(new Date());

  return (
    <div className="availability-card">
      <div className="availability-header">
        <h2>Check Campground Availability</h2>
      </div>
      <div className="availability-body">
        <div className="availability-row">
          <select
            id="month-select"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="month-select"
            disabled={localLoading}
            aria-label="Select a month"
          >
            <option value="">Select a month...</option>
            {availableMonths.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchAvailability}
            className="check-availability-btn"
            disabled={!selectedMonth || localLoading}
            aria-label="Check availability"
          >
            {localLoading ? (
              <>
                <LoadingSpinner size="small" />
                <span style={{ marginLeft: "8px" }}>Loading...</span>
              </>
            ) : (
              "Check"
            )}
          </button>
        </div>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

AvailabilityChecker.propTypes = {
  facilityID: PropTypes.string.isRequired,
  facilityName: PropTypes.string.isRequired,
  setIsLoading: PropTypes.func.isRequired,
};

export default AvailabilityChecker;
