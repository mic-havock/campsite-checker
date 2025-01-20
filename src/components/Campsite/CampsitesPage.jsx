import { useLocation, useNavigate } from "react-router-dom";
import Campsite from "./Campsite";
import "./CampsitesPage.css";

const CampsitesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites } = location.state || {}; // Access campsites

  return (
    <div>
      <h1>Campsites</h1>
      {campsites && campsites.length > 0 ? (
        <div className="campsites-grid">
          {campsites.map((campsite) => (
            <Campsite key={campsite.CampsiteID} campsite={campsite} />
          ))}
        </div>
      ) : (
        <p>No campsites available for this facility.</p>
      )}
      <button onClick={() => navigate(-1)}>Back to Facilities</button>
    </div>
  );
};

export default CampsitesPage;
