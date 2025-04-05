import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { isNonReservableStatus } from "../../config/reservationStatus";
import AlertModal from "../Common/AlertModal/AlertModal";
import "./campsite-availability.scss";

/**
 * Groups availability data by month and displays a calendar view for each month
 * @param {Object} props - Component props
 * @param {Object} props.availabilities - Object containing availability data by date
 * @returns {JSX.Element} Monthly calendar view of campsite availability
 */
const CampsiteAvailability = ({ availabilities, facilityName, campsite }) => {
  const [alertModal, setAlertModal] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [alertDetails, setAlertDetails] = useState({
    name: "",
    email: "",
    startDate: "",
    endDate: "",
  });

  // Group availabilities by month
  const monthlyAvailabilities = useMemo(() => {
    console.log(JSON.stringify(campsite));
    const months = {};

    Object.entries(availabilities).forEach(([dateStr, status]) => {
      const [year, month, day] = dateStr
        .split("-")
        .map((num) => parseInt(num, 10));
      const date = new Date(year, month - 1, day);

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

  const handleDayClick = (status, date) => {
    if (status === "Reserved" || status === "NYR") {
      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      setAlertDetails((prev) => ({
        ...prev,
        startDate: formattedDate,
        endDate: formattedDate,
      }));
      setAlertModal(true);
    }
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
        <p className="info-text">
          Click on a Reserved or Not Yet Released date to create an availability
          alert
        </p>
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
                  const date = new Date(year, month, dayNum);
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
                      onClick={() => handleDayClick(status, date)}
                    >
                      <span className="day-number">{dayNum}</span>
                      {/* <span className="day-status">{status}</span> */}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertModal
        isOpen={alertModal}
        onClose={() => setAlertModal(false)}
        title="Create Availability Alert"
        subtitle={
          campsite
            ? `Campsite: ${campsite.CampsiteName} - ${campsite.Loop}`
            : ""
        }
        alertDetails={alertDetails}
        setAlertDetails={setAlertDetails}
        isCreatingAlert={isCreatingAlert}
        setIsCreatingAlert={setIsCreatingAlert}
        selectedCampsite={campsite}
        campsiteName={facilityName}
      />
    </div>
  );
};

CampsiteAvailability.propTypes = {
  availabilities: PropTypes.objectOf(PropTypes.string).isRequired,
  facilityName: PropTypes.string.isRequired,
  campsite: PropTypes.object.isRequired,
};

export default CampsiteAvailability;
