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

  const renderCampsites = () => {
    return Object.keys(availabilityData.campsites).map((campsiteId) => {
      const campsite = availabilityData.campsites[campsiteId];
      const quantities = Object.entries(campsite.quantities).map(
        ([date, quantity]) => ({
          date,
          quantity,
        })
      );

      return (
        <div key={campsiteId} className="campsite-details">
          <h2>{`Campsite ${campsite.site} - ${campsite.loop}`}</h2>
          <p>
            <strong>Type:</strong> {campsite.campsite_type}
          </p>
          <p>
            <strong>Capacity:</strong> {campsite.min_num_people} -{" "}
            {campsite.max_num_people} people
          </p>
          <div className="availability-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Availability</th>
                </tr>
              </thead>
              <tbody>
                {quantities.map(({ date, quantity }) => (
                  <tr key={date}>
                    <td>{new Date(date).toLocaleDateString()}</td>
                    <td>{quantity > 0 ? "Available" : "Unavailable"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    });
  };

  return (
    <div>
      <h1>Reservation Details</h1>
      <div className="campsite-list">{renderCampsites()}</div>
      <button onClick={() => navigate(-1)}>Back to Campsites</button>
    </div>
  );
};

export default ReservationDetailsPage;
