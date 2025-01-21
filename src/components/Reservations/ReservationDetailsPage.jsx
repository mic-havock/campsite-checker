import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ReservationDetailsPage.css";

const ReservationDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { availabilityData } = location.state || {};
  const [alertModal, setAlertModal] = useState(false);
  const [selectedCampsite, setSelectedCampsite] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [alertDetails, setAlertDetails] = useState({
    name: "",
    email: "",
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

  const handleUnavailableClick = (campsite, date) => {
    setSelectedCampsite(campsite);
    setSelectedDate(date);
    setAlertModal(true);
  };

  const handleCreateAlert = () => {
    const { name, email } = alertDetails;
    if (!name || !email) {
      alert("Please fill in all fields.");
      return;
    }

    // Pass the details to your alert creation API or function
    console.log("Alert Created:", {
      campsite_id: selectedCampsite.campsite_id,
      date: selectedDate,
      name,
      email,
    });

    setAlertModal(false);
    alert("Alert created successfully!");
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
                        ? handleUnavailableClick(campsite, date)
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
        <div className="modal">
          <h2>Create Availability Alert</h2>
          <p>{`Campsite: ${selectedCampsite.site} - ${selectedCampsite.loop}`}</p>
          <p>{`Date: ${new Date(selectedDate).toLocaleDateString()}`}</p>
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
          <button onClick={handleCreateAlert}>Create Alert</button>
          <button onClick={() => setAlertModal(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ReservationDetailsPage;
