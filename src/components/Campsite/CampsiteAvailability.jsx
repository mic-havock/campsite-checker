import PropTypes from "prop-types";
import { useMemo, useRef, useState } from "react";
import reservationsAPI from "../../api/reservations";
import { isNonReservableStatus } from "../../config/reservationStatus";
import AlertModal from "../Common/AlertModal/AlertModal";
import "./campsite-availability.scss";

/**
 * Groups availability data by month and displays a calendar view for each month
 * @param {Object} props - Component props
 * @param {Object} props.availabilities - Object containing availability data by date
 * @returns {JSX.Element} Monthly calendar view of campsite availability
 */
const CampsiteAvailability = ({
  availabilities,
  facilityName,
  campsiteNumber,
  campsiteId,
}) => {
  const [alertModal, setAlertModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const isSubmitting = useRef(false);
  const [alertDetails, setAlertDetails] = useState({
    name: "",
    email: "",
    startDate: "",
    endDate: "",
  });
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);

  const forceUpdate = () => {
    setForceUpdateCounter((prev) => prev + 1);
  };

  // Group availabilities by month
  const monthlyAvailabilities = useMemo(() => {
    console.log(availabilities);
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
      setSelectedDate(formattedDate);
      setAlertDetails((prev) => ({
        ...prev,
        startDate: formattedDate,
        endDate: formattedDate,
      }));
      setAlertModal(true);
    }
  };

  const handleCreateAlert = async () => {
    // Prevent duplicate submissions
    if (isSubmitting.current) {
      return;
    }

    // Form validation
    const { name, email, startDate, endDate } = alertDetails;
    if (!name || !email || !startDate || !endDate) {
      alert("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Set loading state
    isSubmitting.current = true;
    setIsCreatingAlert(true);
    // Force a re-render to ensure loading state is visible
    forceUpdate();

    // Prepare data
    const reservationData = {
      name,
      email_address: email,
      campsite_id: campsiteId,
      campsite_number: campsiteNumber,
      campsite_name: facilityName,
      reservation_start_date: startDate,
      reservation_end_date: endDate,
      monitoring_active: true,
      attempts_made: 0,
      success_sent: false,
    };

    try {
      const result = await reservationsAPI.create(reservationData);

      // Reset states BEFORE showing alert
      setIsCreatingAlert(false);
      isSubmitting.current = false;
      // Force a re-render to ensure loading state is updated
      forceUpdate();

      // Ensure the spinner is hidden using direct DOM manipulation as a fallback
      try {
        const spinnerElements = document.querySelectorAll(
          ".create-alert-btn .loading-spinner"
        );
        spinnerElements.forEach((el) => {
          el.style.display = "none";
        });
      } catch {
        // Silently handle any DOM manipulation errors
      }

      // Close modal and reset form
      setAlertModal(false);
      setAlertDetails({ name: "", email: "", startDate: "", endDate: "" });

      // Show success message AFTER state updates
      window.setTimeout(() => {
        alert(
          `Alert created successfully! Reservation ID: ${result.id}\n\nIf your selection becomes available, you will receive an email.`
        );
      }, 50);
    } catch (error) {
      // Reset states BEFORE showing alert
      setIsCreatingAlert(false);
      isSubmitting.current = false;
      // Force a re-render to ensure loading state is updated
      forceUpdate();

      // Ensure the spinner is hidden using direct DOM manipulation as a fallback
      try {
        const spinnerElements = document.querySelectorAll(
          ".create-alert-btn .loading-spinner"
        );
        spinnerElements.forEach((el) => {
          el.style.display = "none";
        });
      } catch {
        // Silently handle any DOM manipulation errors
      }

      // Show error message AFTER state updates
      window.setTimeout(() => {
        alert(error.message || "Failed to create alert. Please try again.");
      }, 50);
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
                      <span className="day-status">{status}</span>
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
        onCreateAlert={handleCreateAlert}
        title="Create Availability Alert"
        subtitle={`Date: ${selectedDate}`}
        alertDetails={alertDetails}
        setAlertDetails={setAlertDetails}
        isCreatingAlert={isCreatingAlert}
        forceUpdateCounter={forceUpdateCounter}
      />
    </div>
  );
};

CampsiteAvailability.propTypes = {
  availabilities: PropTypes.objectOf(PropTypes.string).isRequired,
  facilityName: PropTypes.string.isRequired,
  campsiteNumber: PropTypes.string.isRequired,
  campsiteId: PropTypes.string.isRequired,
};

export default CampsiteAvailability;
