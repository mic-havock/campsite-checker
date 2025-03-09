import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../../Common/LoadingSpinner/LoadingSpinner";
import AvailabilityChecker from "../Filters/AvailabilityChecker";
import CampsiteFilter from "../Filters/CampsiteFilter";
import CampsiteMap from "../Map/CampsiteMap";
import "./map-view.scss";

//MapView displays a dedicated page with a map of campsite locations
const MapView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites, facilityName } = location.state || {};
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReservableOnly, setShowReservableOnly] = useState(false);
  const [selectedLoops, setSelectedLoops] = useState([]);
  const [campsiteData, setCampsiteData] = useState([]);
  const facilityID = campsites?.[0]?.FacilityID;

  useEffect(() => {
    // Check if we have the required data
    if (!campsites || !Array.isArray(campsites) || campsites.length === 0) {
      setError("No campsite data available. Please go back and try again.");
      setIsLoading(false);
      return;
    }

    setCampsiteData(campsites);
    setIsLoading(false);
  }, [campsites]);

  /**
   * Navigate back to the campsites page with the current data
   */
  const navigateToCampsitesPage = () => {
    navigate("/campsites", {
      state: {
        campsites: campsiteData,
        facilityName: facilityName || "Campground",
      },
    });
  };

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

      <div className="controls-wrapper">
        <div className="controls-container">
          <div className="filter-section">
            {/* CampsiteFilter component */}
            <CampsiteFilter
              campsiteData={campsiteData}
              filteredCampsites={filteredCampsites}
              setShowReservableOnly={setShowReservableOnly}
              showReservableOnly={showReservableOnly}
              selectedLoops={selectedLoops}
              setSelectedLoops={setSelectedLoops}
            />
          </div>

          <div className="right-controls">
            {/* AvailabilityChecker component */}
            <AvailabilityChecker
              facilityID={facilityID}
              facilityName={facilityName}
              setIsLoading={setIsLoading}
            />
          </div>

          <button
            onClick={navigateToCampsitesPage}
            className="view-campsites-btn"
          >
            <span className="list-icon"></span>
            View as List
          </button>
        </div>
      </div>

      <div className="map-container">
        <CampsiteMap
          campsites={filteredCampsites}
          facilityName={facilityName || "Campground"}
        />
      </div>
    </div>
  );
};

export default MapView;
