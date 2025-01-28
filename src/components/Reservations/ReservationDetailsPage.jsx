import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import reservationsAPI from "../../api/reservations";
import "./reservation-details.scss";

const ReservationDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { availabilityData } = location.state || {};
  const [alertModal, setAlertModal] = useState(false);
  const [selectedCampsite, setSelectedCampsite] = useState(null);
  const [alertDetails, setAlertDetails] = useState({
    name: "",
    email: "",
    startDate: "",
    endDate: "",
  });

  if (!availabilityData || !availabilityData.campsites) {
    return (
      <div>
        <h1>Reservation Details</h1>
        <p>No availability data found. Please go back and try again.</p>
        <button onClick={() => navigate(-1)}>Back to Campsites</button>
      </div>
    );
  }

  const handleUnavailableClick = (campsite) => {
    setSelectedCampsite(campsite);
    setAlertModal(true);
  };

  const handleCreateAlert = async () => {
    const { name, email, startDate, endDate } = alertDetails;
    if (!name || !email || !startDate || !endDate) {
      alert("Please fill in all fields.");
      return;
    }

    const reservationData = {
      name,
      email_address: email,
      campsite_id: selectedCampsite.campsite_id,
      reservation_start_date: startDate,
      reservation_end_date: endDate,
      monitoring_active: true, // Set default or desired value
      attempts_made: 0, // Set default or desired value
      success_sent: false, // Set default or desired value
    };

    try {
      // Call the reservations API to create a new reservation
      const result = await reservationsAPI.create(reservationData);
      setAlertModal(false);
      alert(`Alert created successfully! Reservation ID: ${result.id}`);
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Failed to create alert. Please try again.");
    }
  };

  const renderCalendar = () => {
    const campsites = Object.values(availabilityData.campsites);

    const dates = Array.from(
      new Set(
        campsites.flatMap((campsite) =>
          Object.keys(campsite.quantities).map(
            (date) => new Date(date).toISOString().split("T")[0]
          )
        )
      )
    ).sort();

    return (
      <div className="calendar-view">
        <table>
          <thead>
            <tr>
              <th>Campsite</th>
              {dates.map((date) => (
                <th key={date}>{new Date(date).toLocaleDateString()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campsites.map((campsite) => (
              <tr key={campsite.campsite_id}>
                <td>{`Campsite ${campsite.site} - ${campsite.loop}`}</td>
                {dates.map((date) => (
                  <td
                    key={`${campsite.campsite_id}-${date}`}
                    className={
                      campsite.quantities[`${date}T00:00:00Z`] > 0
                        ? "available"
                        : "unavailable"
                    }
                    onClick={() =>
                      campsite.quantities[`${date}T00:00:00Z`] === 0
                        ? handleUnavailableClick(campsite)
                        : null
                    }
                  >
                    {campsite.quantities[`${date}T00:00:00Z`] > 0 ? "A" : "X"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <h1>Reservation Details</h1>
      {renderCalendar()}
      <button onClick={() => navigate(-1)}>Back to Campsites</button>

      {alertModal && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setAlertModal(false)}
          ></div>
          <div className="modal">
            <h2>Create Availability Alert</h2>
            <p>{`Campsite: ${selectedCampsite.site} - ${selectedCampsite.loop}`}</p>
            <input
              type="text"
              placeholder="Name"
              value={alertDetails.name}
              onChange={(e) =>
                setAlertDetails((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <input
              type="email"
              placeholder="Email"
              value={alertDetails.email}
              onChange={(e) =>
                setAlertDetails((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <label>Start Date:</label>
            <input
              type="date"
              value={alertDetails.startDate}
              onChange={(e) =>
                setAlertDetails((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
            />
            <label>End Date:</label>
            <input
              type="date"
              value={alertDetails.endDate}
              onChange={(e) =>
                setAlertDetails((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
            />
            <button onClick={handleCreateAlert}>Create Alert</button>
            <button onClick={() => setAlertModal(false)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReservationDetailsPage;
