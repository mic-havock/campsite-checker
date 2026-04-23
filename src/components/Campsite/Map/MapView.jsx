import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../../Common/LoadingSpinner/LoadingSpinner";
import AvailabilityChecker from "../Filters/AvailabilityChecker";
import CampsiteFilter from "../Filters/CampsiteFilter";
import CampsiteMap from "../Map/CampsiteMap";
import "./map-view.scss";

const MapView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites, facilityName, facilityState } = location.state || {};
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReservableOnly, setShowReservableOnly] = useState(false);
  const [selectedLoops, setSelectedLoops] = useState([]);
  const [campsiteData, setCampsiteData] = useState([]);
  const facilityID = campsites?.[0]?.FacilityID;

  useEffect(() => {
    if (!campsites || !Array.isArray(campsites) || campsites.length === 0) {
      setError("No campsite data available. Please go back and try again.");
      setIsLoading(false);
      return;
    }

    setCampsiteData(campsites);
    setIsLoading(false);
  }, [campsites]);

  const navigateToCampsitesPage = () => {
    navigate("/campsites", {
      state: {
        campsites: campsiteData,
        facilityName: facilityName || "Campground",
        facilityState: facilityState,
      },
    });
  };

  const filteredCampsites = campsiteData.filter((campsite) => {
    const reservableMatch = !showReservableOnly || campsite.CampsiteReservable;
    const loopMatch =
      selectedLoops.length === 0 ||
      (campsite.Loop && selectedLoops.includes(campsite.Loop));
    return reservableMatch && loopMatch;
  });

  const mapSchema = {
    "@context": "https://schema.org",
    "@type": "Map",
    name: "Campground Locations Map",
    description: "Interactive map showing available campground locations",
  };

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
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(mapSchema)}</script>
      </Helmet>
      <div className="map-view-page">
        <div className="hero-section">
          <div className="hero-top-bar">
            <button
              className="back-to-search-btn"
              onClick={() => navigate("/")}
              aria-label="Back to search"
            >
              ← Back to Search
            </button>
          </div>
          <div className="hero-content">
            <h1>
              {facilityName || "Campground"}
              {facilityState && <span className="state-indicator"> ({facilityState})</span>}
            </h1>
            <p className="description">Explore available campsites and check real-time availability</p>
          </div>
        </div>

        <div className="controls-wrapper">
          <div className="controls-container">
            <div className="filter-section">
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
              <AvailabilityChecker
                facilityID={facilityID}
                facilityName={facilityName}
                setIsLoading={setIsLoading}
              />
            </div>
          </div>

          <div className="view-toggle-container">
            <button
              className="view-toggle-btn"
              onClick={navigateToCampsitesPage}
            >
              List View
            </button>
            <button
              className="view-toggle-btn active"
              onClick={() => {}}
            >
              Map View
            </button>
          </div>

        </div>

        <div className="status-indicator">
          Showing {filteredCampsites.length} of {campsiteData.length} sites
        </div>

        <div className="map-container">
          <CampsiteMap
            campsites={filteredCampsites}
            facilityName={facilityName || "Campground"}
          />
        </div>

      </div>
    </>
  );
};

export default MapView;
