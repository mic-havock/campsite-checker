import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import Campsite from "./Campsite";
import "./campsites-page.scss";
import AvailabilityChecker from "./Filters/AvailabilityChecker";
import CampsiteFilter from "./Filters/CampsiteFilter";
import CampsiteMap from "./Map/CampsiteMap";

const useFilteredCampsites = (
  campsiteData,
  showReservableOnly,
  selectedLoops,
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

const CampsiteExplorer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites: initialCampsites, facilityName, facilityState } = location.state || {};

  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const [campsiteData, setCampsiteData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReservableOnly, setShowReservableOnly] = useState(false);
  const [selectedLoops, setSelectedLoops] = useState([]);

  useEffect(() => {
    if (!initialCampsites || initialCampsites.length === 0) {
      // If we don't have campsites in state, we might have navigated directly
      // In a real app we'd fetch them here, but for now we'll just handle the empty state
      return;
    }

    const filteredAndSortedCampsites = initialCampsites
      .filter((campsite) => !campsite.CampsiteName.includes("Don't Use"))
      .sort((a, b) => a.CampsiteName.localeCompare(b.CampsiteName));

    setCampsiteData(filteredAndSortedCampsites);
  }, [initialCampsites]);

  const filteredCampsites = useFilteredCampsites(
    campsiteData,
    showReservableOnly,
    selectedLoops,
  );

  const facilityID = campsiteData?.[0]?.FacilityID;

  // Force scroll to top when data is hydrated to prevent async race conditions
  useLayoutEffect(() => {
    if (campsiteData.length > 0) {
      window.scrollTo(0, 0);
    }
  }, [campsiteData]);

  if (!initialCampsites || initialCampsites.length === 0) {
    return (
      <div className="campsites-page">
        <div className="error-container">
          <h1>No Campsites Available</h1>
          <p>There are no campsites available for this facility at the moment.</p>
          <button onClick={() => navigate("/")} className="back-button">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{facilityName ? `${facilityName} | Kamp Scout` : 'Campsite Explorer | Kamp Scout'}</title>
      </Helmet>

      <div className="campsites-page explorer-mode">
        {loading && <LoadingSpinner fullPage />}

        <div className="hero-section persistent-stack">
          <div className="hero-content">
            <h1>
              {facilityName || "Campground"}
              {facilityState && <span className="state-indicator"> ({facilityState})</span>}
            </h1>
            <p className="description">Explore available campsites and check real-time availability</p>
          </div>
        </div>

        <div className="controls-wrapper persistent-stack">
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
                setIsLoading={setLoading}
              />
            </div>
          </div>

          <div className="view-toggle-fixed-height">
            <div className="view-toggle-container">
              <button
                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
              >
                List View
              </button>
              <button
                className={`view-toggle-btn ${viewMode === "map" ? "active" : ""}`}
                onClick={() => setViewMode("map")}
              >
                Map View
              </button>
            </div>
          </div>

          <div className="status-indicator">
            Showing {filteredCampsites.length} of {campsiteData.length} sites
          </div>
        </div>

        <div className="view-content-area">
          {viewMode === "list" ? (
            <div className="campsites-grid">
              {filteredCampsites.map((campsite) => (
                <Campsite
                  key={campsite.CampsiteID}
                  campsite={campsite}
                  facilityName={facilityName}
                  showExpandHint={false}
                />
              ))}
            </div>
          ) : (
            <div className="map-view-container">
              <CampsiteMap
                campsites={filteredCampsites}
                facilityName={facilityName || "Campground"}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CampsiteExplorer;
