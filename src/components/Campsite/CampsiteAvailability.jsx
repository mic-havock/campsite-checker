import PropTypes from "prop-types";
import { useMemo } from "react";
import { isNonReservableStatus } from "../../config/reservationStatus";
import "./campsite-availability.scss";

/**
 * Groups availability data by month and displays a calendar view for each month
 * @param {Object} props - Component props
 * @param {Object} props.availabilities - Object containing availability data by date
 * @returns {JSX.Element} Monthly calendar view of campsite availability
 */
const CampsiteAvailability = ({ availabilities }) => {
  // Group availabilities by month
  const monthlyAvailabilities = useMemo(() => {
    const months = {};

    Object.entries(availabilities).forEach(([dateStr, status]) => {
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!months[monthKey]) {
        months[monthKey] = {
          year: date.getFullYear(),
          month: date.getMonth(),
          days: {},
        };
      }

      months[monthKey].days[date.getDate()] = status;
    });

    return Object.values(months);
  }, [availabilities]);

  // Get status color class
  const getStatusClass = (status) => {
    switch (status) {
      case "Reserved":
        return "status-reserved";
      case "Available":
      case "Open":
        return "status-available";
      default:
        if (isNonReservableStatus(status)) {
          return "status-not-reservable";
        }
        if (status === "NYR") {
          return "status-nyr";
        }
        return "status-reserved";
    }
  };

  // Get month name
  const getMonthName = (monthIndex) => {
    return new Date(2000, monthIndex).toLocaleString("default", {
      month: "long",
    });
  };

  return (
    <div className="availability-section">
      <div className="availability-legend">
        <div className="legend-item">
          <span className="status-dot status-available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="status-dot status-reserved"></span>
          <span>Reserved</span>
        </div>
        <div className="legend-item">
          <span className="status-dot status-nyr"></span>
          <span>Not Yet Released</span>
        </div>
        <div className="legend-item">
          <span className="status-dot status-not-reservable"></span>
          <span>Not Reservable/Not Available</span>
        </div>
      </div>
      <div className="monthly-calendars">
        {monthlyAvailabilities.map(({ year, month, days }) => (
          <div key={`${year}-${month}`} className="month-calendar">
            <h4>{`${getMonthName(month)} ${year}`}</h4>
            <div className="calendar-grid">
              <div className="calendar-header">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div key={day} className="day-header">
                      {day}
                    </div>
                  )
                )}
              </div>
              <div className="calendar-days">
                {Array.from({
                  length: new Date(year, month + 1, 0).getDate(),
                }).map((_, index) => {
                  const dayNum = index + 1;
                  const status = days[dayNum];
                  return (
                    <div
                      key={dayNum}
                      className={`calendar-day ${
                        status ? getStatusClass(status) : ""
                      }`}
                      style={{
                        gridColumnStart:
                          dayNum === 1
                            ? new Date(year, month, 1).getDay() + 1
                            : "auto",
                      }}
                    >
                      <span className="day-number">{dayNum}</span>
                      <span className="day-status">{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

CampsiteAvailability.propTypes = {
  availabilities: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default CampsiteAvailability;
