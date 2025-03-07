import PropTypes from "prop-types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCampgroundAvailability } from "../../api/campsites";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import "./availability-checker.scss";

/**
 * Component for checking campsite availability for a selected month
 * @param {Object} props - Component props
 * @param {string} props.facilityID - ID of the facility to check availability for
 * @param {string} props.facilityName - Name of the facility
 * @param {Function} props.setIsLoading - Function to update loading state in parent component
 */
const AvailabilityChecker = ({ facilityID, facilityName, setIsLoading }) => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  /**
   * Get the next 12 months from the current date
   * @returns {Array} Array of month objects with value, label, month, and year properties
   */
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

  /**
   * Handle month selection change
   * @param {Object} event - Change event
   */
  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  /**
   * Fetch availability data for the selected month and navigate to the reservation details page
   */
  const fetchAvailability = async () => {
    if (!selectedMonth) {
      alert("Please select a month.");
      return;
    }

    setLocalLoading(true);
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

      navigate("/reservation-details", {
        state: {
          availabilityData: data,
          facilityID: facilityID,
          campsiteName: facilityName,
        },
      });
    } catch (error) {
      console.error("Error fetching availability data:", error);
      alert("Could not fetch availability. Please try again later.");
    } finally {
      setLocalLoading(false);
      setIsLoading(false);
    }
  };

  const availableMonths = getNextMonths();

  return (
    <div className="availability-card">
      <div className="availability-header">
        <h2>Check Campgound Availability</h2>
      </div>
      <div className="availability-body">
        <div className="availability-row">
          <select
            id="month-select"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="month-select"
            disabled={localLoading}
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
