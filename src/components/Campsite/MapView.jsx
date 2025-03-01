import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import CampsiteFilter from "./CampsiteFilter";
import CampsiteMap from "./CampsiteMap";
import "./map-view.scss";

/**
 * MapView component displays a dedicated page with a map of campsite locations
 *
 * @returns {JSX.Element} - Rendered component
 */
const MapView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites, facilityName } = location.state || {};
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReservableOnly, setShowReservableOnly] = useState(false);
  const [selectedLoops, setSelectedLoops] = useState([]);
  const [campsiteData, setCampsiteData] = useState([]);

  useEffect(() => {
    // Check if we have the required data
    if (!campsites || !Array.isArray(campsites) || campsites.length === 0) {
      setError("No campsite data available. Please go back and try again.");
      setIsLoading(false);
      return;
    }

    // Initialize campsite data
    setCampsiteData(campsites);

    // Simulate loading for map resources
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [campsites]);

  // Filter campsites based on both reservable and loop filters
  const filteredCampsites = campsiteData.filter((campsite) => {
    const reservableMatch = !showReservableOnly || campsite.CampsiteReservable;
    const loopMatch =
      selectedLoops.length === 0 ||
      (campsite.Loop && selectedLoops.includes(campsite.Loop));
    return reservableMatch && loopMatch;
  });

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (error) {
    return (
      <div className="map-view-page">
        <div className="error-container">
          <h1>Error Loading Map</h1>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-button">
            <span className="back-arrow">←</span> Back to Campsites
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view-page">
      <div className="map-view-header">
        <h1>{facilityName || "Campground"}</h1>
      </div>

      <div className="map-filters">
        <div className="filter-container">
          {/* Using the CampsiteFilter component */}
          <CampsiteFilter
            campsiteData={campsiteData}
            filteredCampsites={filteredCampsites}
            setShowReservableOnly={setShowReservableOnly}
            showReservableOnly={showReservableOnly}
            selectedLoops={selectedLoops}
            setSelectedLoops={setSelectedLoops}
          />
        </div>
      </div>

      <div className="map-container">
        <CampsiteMap
          campsites={filteredCampsites}
          facilityName={facilityName || "Campground"}
        />
      </div>

      <div className="map-view-footer">
        <button onClick={() => navigate(-1)} className="back-button">
          <span>←</span> Back to Campsites
        </button>
      </div>
    </div>
  );
};

export default MapView;
