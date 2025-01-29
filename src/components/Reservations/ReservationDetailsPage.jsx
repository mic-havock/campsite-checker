import { Button } from "@trussworks/react-uswds";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import reservationsAPI from "../../api/reservations";
import "./reservation-details.scss";

const ReservationDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { availabilityData } = location.state || {};
  const [alertModal, setAlertModal] = useState(false);
  const [selectedCampsite, setSelectedCampsite] = useState(null);
  const [tableWidth, setTableWidth] = useState(window.innerWidth);
  const [alertDetails, setAlertDetails] = useState({
    name: "",
    email: "",
    startDate: "",
    endDate: "",
  });

  console.log(JSON.stringify(availabilityData, null, 2));
  useEffect(() => {
    const handleResize = () => {
      setTableWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!availabilityData || !availabilityData.campsites) {
    return (
      <div>
        <h1>Campground Availability For Details</h1>
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
      alert(
        `\nAlert created successfully! Reservation ID: ${result.id} \n\nIf your selection becomes available, you will receive an email.`
      );
      setAlertDetails({ name: "", email: "", startDate: "", endDate: "" });
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

    const tableContainerStyle = {
      maxHeight: "800px",
      overflowX: "auto",
      overflowY: "auto",
      position: "relative",
      width: `${tableWidth}px`,
    };

    const tableStyle = {
      width: `${tableWidth}px`, // Dynamically adjust width
      minWidth: "600px", // Ensure the table doesn't get too small
      borderCollapse: "collapse",
      paddingLeft: "1rem",
      backgroundColor: "#cdcdcd",
    };

    const stickyHeaderStyle = {
      position: "sticky",
      top: 0,
      backgroundColor: "#cdcdcd",
      zIndex: 1, // Lower z-index than the pinned column
    };

    const stickyColumnStyle = {
      position: "sticky",
      left: 0,
      backgroundColor: "#cdcdcd",
      zIndex: 2, // Higher z-index to prevent overlap by the header
    };

    const intersectionStyle = {
      ...stickyHeaderStyle,
      ...stickyColumnStyle,
      zIndex: 3, // Highest z-index for the top-left cell
    };

    const cellStyle = {
      border: "1px solid",
      padding: "8px",
      textAlign: "center",
      whiteSpace: "nowrap",
    };

    const availableStyle = {
      ...cellStyle,
      backgroundColor: "#7ee875", // Light green
    };

    const unavailableStyle = {
      ...cellStyle,
      cursor: "pointer", // Pointer cursor for hoverable cells
      transition: "background-color 0.3s ease", // Smooth transition for hover effect
      backgroundColor: "#d65140", // Light red
    };

    const unavailableButtonStyle = {
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      //fontSize: "16px",
      //fontWeight: "bold",
      // color: "#d9534f", // Bootstrap "danger" red
      width: "100%",
      height: "100%",
      transition: "background-color 0.3s ease, border 0.3s ease",
    };

    return (
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...cellStyle, ...intersectionStyle }}>Campsite</th>
              {dates.map((date) => (
                <th key={date} style={{ ...cellStyle, ...stickyHeaderStyle }}>
                  {new Date(date).toLocaleDateString()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campsites.map((campsite) => (
              <tr key={campsite.campsite_id}>
                <td style={{ ...cellStyle, ...stickyColumnStyle }}>
                  {`Campsite ${campsite.site} - ${campsite.loop}`}
                </td>
                {dates.map((date) => (
                  <td
                    key={`${campsite.campsite_id}-${date}`}
                    style={
                      campsite.quantities[`${date}T00:00:00Z`] > 0
                        ? availableStyle
                        : unavailableStyle
                    }
                    onClick={() =>
                      campsite.quantities[`${date}T00:00:00Z`] === 0
                        ? handleUnavailableClick(campsite)
                        : null
                    }
                  >
                    {campsite.quantities[`${date}T00:00:00Z`] > 0 ? (
                      "A"
                    ) : (
                      <Button
                        style={unavailableButtonStyle}
                        onClick={() => handleUnavailableClick(campsite)}
                      >
                        X
                      </Button>
                    )}
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
      <h1>Campground Availablility</h1>
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
