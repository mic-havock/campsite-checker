import { useLocation, useNavigate } from "react-router-dom";
import "./ReservationDetailsPage.css";

const ReservationDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { availabilityData } = location.state || {};

  if (!availabilityData || !availabilityData.campsites) {
    return (
      <div>
        <h1>Reservation Details</h1>
        <p>No availability data found. Please go back and try again.</p>
        <button onClick={() => navigate(-1)}>Back to Campsites</button>
      </div>
    );
  }

  const renderCalendar = () => {
    const campsites = Object.values(availabilityData.campsites);

    // Generate the list of unique dates
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
    </div>
  );
};

export default ReservationDetailsPage;
