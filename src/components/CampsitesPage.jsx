import { useLocation, useNavigate } from "react-router-dom";

const CampsitesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites } = location.state || {}; // Access campsites

  return (
    <div>
      <h1>Campsites</h1>
      {campsites && campsites.length > 0 ? (
        <ul>
          {campsites.map((campsite) => (
            <li key={campsite.CampsiteID}>
              <h3>{campsite.CampsiteName}</h3>
              <p>{campsite.CampsiteType}</p>
              <p>Accessible: {campsite.CampsiteAccessible ? "Yes" : "No"}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No campsites available for this facility.</p>
      )}
      <button onClick={() => navigate(-1)}>Back to Facilities</button>
    </div>
  );
};

export default CampsitesPage;
