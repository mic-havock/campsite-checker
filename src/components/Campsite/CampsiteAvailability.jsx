import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { isAlertableStatus, getAvailabilityCategory } from "../../config/reservationStatus";
import AlertModal from "../Common/AlertModal/AlertModal";
import "./campsite-availability.scss";

const CampsiteAvailability = ({ availabilities, facilityName, campsite }) => {
  const [alertModal, setAlertModal] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [alertDetails, setAlertDetails] = useState({
    name: "",
    email: "",
    startDate: "",
    endDate: "",
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Treat an empty availabilities payload as a first-come, first-served site
  // so we render a notice instead of an empty legend and calendar grid.
  const hasAvailabilityData =
    availabilities && Object.keys(availabilities).length > 0;

  const monthlyAvailabilities = useMemo(() => {
    if (!hasAvailabilityData) return [];

    const months = {};

    Object.entries(availabilities).forEach(([dateStr, status]) => {
      const [year, month, day] = dateStr
        .split("-")
        .map((num) => parseInt(num, 10));
      const date = new Date(year, month - 1, day);

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
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
  }, [availabilities, hasAvailabilityData]);

  const getStatusClass = (status, date) => {
    if (date < today) {
      return "status-not-reservable";
    }

    return `status-${getAvailabilityCategory(status)}`;
  };

  const getMonthName = (monthIndex) => {
    return new Date(2000, monthIndex).toLocaleString("default", {
      month: "long",
    });
  };

  const handleDayClick = (status, date) => {
    if (isAlertableStatus(status)) {
      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
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
      {!hasAvailabilityData ? (
        <div
          className="first-come-first-serve-notice"
          role="status"
          aria-live="polite"
        >
          <h4 className="first-come-first-serve-notice__title">
            First-Come, First-Served Campsite
          </h4>
          <p className="first-come-first-serve-notice__body">
            This campsite is not reservable. It is available on a first-come,
            first-served basis. To secure it, please arrive at the campground
            in person.
          </p>
        </div>
      ) : (
        <>
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
              <span className="status-dot status-checkout"></span>
              <span>Checkout Only</span>
            </div>
            <div className="legend-item">
              <span className="status-dot status-not-reservable"></span>
              <span>Not Reservable/Not Available</span>
            </div>
            <p className="info-text">
              Click Reserved, NYR, or Checkout Only dates for availability alerts
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
                      ),
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
                            status ? getStatusClass(status, date) : ""
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AlertModal
        isOpen={alertModal}
        onClose={() => setAlertModal(false)}
        title="Availability Alert"
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
        facilityId={
          campsite?.FacilityID != null ? String(campsite.FacilityID) : undefined
        }
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
