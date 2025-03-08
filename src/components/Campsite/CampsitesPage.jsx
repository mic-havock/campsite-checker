import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import Campsite from "./Campsite";
import "./campsites-page.scss";
import AvailabilityChecker from "./Filters/AvailabilityChecker";
import CampsiteFilter from "./Filters/CampsiteFilter";

/**
 * CampsitesPage component displays a list of campsites for a selected facility
 * with filtering and availability checking functionality
 *
 * @returns {JSX.Element} - Rendered component
 */
const CampsitesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites, facilityName } = location.state || {};
  const [campsiteData, setCampsiteData] = useState([]);
  const facilityID = campsites?.[0]?.FacilityID;
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [showReservableOnly, setShowReservableOnly] = useState(false);
  const [selectedLoops, setSelectedLoops] = useState([]);

  useEffect(() => {
    if (!campsites || campsites.length === 0) {
      return;
    }

    // Filter out campsites with "Don't Use" in the name and sort the rest alphabetically
    const filteredAndSortedCampsites = campsites
      .filter((campsite) => !campsite.CampsiteName.includes("Don't Use"))
      .sort((a, b) => a.CampsiteName.localeCompare(b.CampsiteName));

    setCampsiteData(filteredAndSortedCampsites);
  }, [campsites]);

  /**
   * Navigate to the map view with the filtered campsite data
   * Shows a loading spinner while preparing to navigate
   */
  const navigateToMapView = () => {
    if (!campsiteData || campsiteData.length === 0) {
      alert("No campsite data available to display on the map.");
      return;
    }

    setIsMapLoading(true);

    // Simulate a short delay to show the loading spinner
    // In a real app, this might be time spent preparing map data
    setTimeout(() => {
      navigate("/map-view", {
        state: {
          campsites: filteredCampsites, // Use filtered campsites instead of all campsites
          facilityName: facilityName || "Campground",
        },
      });
      setIsMapLoading(false);
    }, 500);
  };

  // Filter campsites based on both reservable and loop filters
  const filteredCampsites = campsiteData.filter((campsite) => {
    const reservableMatch = !showReservableOnly || campsite.CampsiteReservable;
    const loopMatch =
      selectedLoops.length === 0 ||
      (campsite.Loop && selectedLoops.includes(campsite.Loop));
    return reservableMatch && loopMatch;
  });

  if (!campsites || campsites.length === 0) {
    return (
      <div className="campsites-page">
        <div className="error-container">
          <h1>No Campsites Available</h1>
          <p>
            There are no campsites available for this facility at the moment.
          </p>
          <button onClick={() => navigate(-1)} className="back-button">
            Back to Campgrounds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campsites-page">
      {isLoading && <LoadingSpinner fullPage />}

      <div className="page-header">
        <h1>{facilityName || "Campground's Campsites"}</h1>
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
            onClick={navigateToMapView}
            className="view-map-btn"
            disabled={isMapLoading}
          >
            {isMapLoading ? (
              <>
                <LoadingSpinner size="small" />
                <span style={{ marginLeft: "8px" }}>Loading...</span>
              </>
            ) : (
              "View on Map"
            )}
          </button>
        </div>
      </div>

      <div className="campsites-grid">
        {filteredCampsites.map((campsite) => (
          <Campsite
            key={campsite.CampsiteID}
            campsite={campsite}
            facilityName={facilityName}
          />
        ))}
      </div>

      <button onClick={() => navigate(-1)} className="back-button">
        <span className="back-arrow">←</span> Back to Campgrounds
      </button>
    </div>
  );
};

export default CampsitesPage;
