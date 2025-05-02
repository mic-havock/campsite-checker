import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import Campsite from "./Campsite";
import "./campsites-page.scss";
import AvailabilityChecker from "./Filters/AvailabilityChecker";
import CampsiteFilter from "./Filters/CampsiteFilter";

//  Custom hook for managing campsite filtering logic
const useFilteredCampsites = (
  campsiteData,
  showReservableOnly,
  selectedLoops
) => {
  return useMemo(() => {
    return campsiteData.filter((campsite) => {
      const reservableMatch =
        !showReservableOnly || campsite.CampsiteReservable;
      const loopMatch =
        selectedLoops.length === 0 ||
        (campsite.Loop && selectedLoops.includes(campsite.Loop));
      return reservableMatch && loopMatch;
    });
  }, [campsiteData, showReservableOnly, selectedLoops]);
};

/**
 * Component for displaying a list of campsites with filtering and availability checking
 * @returns {JSX.Element} CampsitesPage component
 */
const CampsitesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites, facilityName } = location.state || {};
  const [campsiteData, setCampsiteData] = useState([]);
  const facilityID = campsites?.[0]?.FacilityID;
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    isMapLoading: false,
  });
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

  const filteredCampsites = useFilteredCampsites(
    campsiteData,
    showReservableOnly,
    selectedLoops
  );

  const navigateToMapView = () => {
    if (!campsiteData || campsiteData.length === 0) {
      alert("No campsite data available to display on the map.");
      return;
    }

    setLoadingState((prev) => ({ ...prev, isMapLoading: true }));

    navigate("/map-view", {
      state: {
        campsites: filteredCampsites,
        facilityName: facilityName || "Campground",
      },
    });
    setLoadingState((prev) => ({ ...prev, isMapLoading: false }));
  };

  if (!campsites || campsites.length === 0) {
    return (
      <div className="campsites-page">
        <div className="error-container">
          <h1>No Campsites Available</h1>
          <p>
            There are no campsites available for this facility at the moment.
          </p>
          <button onClick={() => navigate("/")} className="back-button">
            Back to Campgrounds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campsites-page">
      {loadingState.isLoading && <LoadingSpinner fullPage />}

      <div className="page-header">
        <h1>{facilityName + " - Campsites" || "Campground's Campsites"}</h1>
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
              setIsLoading={(isLoading) =>
                setLoadingState((prev) => ({ ...prev, isLoading }))
              }
            />
          </div>

          <button
            onClick={navigateToMapView}
            className="view-map-btn"
            disabled={loadingState.isMapLoading}
          >
            {loadingState.isMapLoading ? (
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

      <button onClick={() => navigate("/")} className="back-button">
        <span className="back-arrow">←</span> Back to Campgrounds
      </button>
    </div>
  );
};

export default CampsitesPage;
