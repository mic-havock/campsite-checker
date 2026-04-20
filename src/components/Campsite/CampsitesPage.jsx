import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import Campsite from "./Campsite";
import "./campsites-page.scss";
import AvailabilityChecker from "./Filters/AvailabilityChecker";
import CampsiteFilter from "./Filters/CampsiteFilter";
import AvailabilityHeatmap from "../CampgroundAvailability/AvailabilityHeatmap";
import { List } from "react-window";
import PropTypes from "prop-types";

const Row = ({ index, style, data }) => {
  const { filteredCampsites, selectedCampsite, setSelectedCampsite } = data;
  const campsite = filteredCampsites[index];
  const isSelected = selectedCampsite?.CampsiteID === campsite.CampsiteID;

  return (
    <div style={style} className="virtual-row-wrapper">
      <div
        className={`campsite-summary-row ${isSelected ? "selected" : ""}`}
        onClick={() => setSelectedCampsite(campsite)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setSelectedCampsite(campsite);
          }
        }}
      >
        <div className="summary-site">Site {campsite.CampsiteName}</div>
        <div className="summary-location">{campsite.Loop}</div>
      </div>
    </div>
  );
};

Row.propTypes = {
  index: PropTypes.number.isRequired,
  style: PropTypes.object.isRequired,
  data: PropTypes.shape({
    filteredCampsites: PropTypes.array.isRequired,
    selectedCampsite: PropTypes.object,
    setSelectedCampsite: PropTypes.func.isRequired,
  }).isRequired,
};

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

const CampsitesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campsites, facilityName, facility } = location.state || {};
  const [campsiteData, setCampsiteData] = useState([]);
  const [listHeight, setListHeight] = useState(600);
  const facilityID = campsites?.[0]?.FacilityID;
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    isMapLoading: false,
  });
  const [showReservableOnly, setShowReservableOnly] = useState(false);
  const [selectedLoops, setSelectedLoops] = useState([]);
  const [selectedCampsite, setSelectedCampsite] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight;
      const height = Math.max(400, vh - 500); // 500px for hero + heatmap + controls
      setListHeight(height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!campsites || campsites.length === 0) {
      return;
    }

    const filteredAndSortedCampsites = campsites
      .filter((campsite) => !campsite.CampsiteName.includes("Don't Use"))
      .sort((a, b) => a.CampsiteName.localeCompare(b.CampsiteName));

    setCampsiteData(filteredAndSortedCampsites);
  }, [campsites]);

  const filteredCampsites = useFilteredCampsites(
    campsiteData,
    showReservableOnly,
    selectedLoops,
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

  const generateCampsiteSchema = (campsite) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: campsite.CampsiteName,
    description: campsite.CampsiteDescription,
    category: "Campsite",
    offers: {
      "@type": "Offer",
      availability: campsite.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: "USD",
      price: campsite.CampsiteFee || "0",
    },
  });

  const listingSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: campsites.map((campsite, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: generateCampsiteSchema(campsite),
    })),
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
            Back to Search
          </button>
        </div>
      </div>
    );
  }



  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(listingSchema)}
        </script>
      </Helmet>
      <div className="campsites-page">
        {loadingState.isLoading && <LoadingSpinner fullPage />}

        <header className="campground-hero">
          <div className="hero-content">
            <div className="hero-main">
              <h1>{facilityName || "Campground"}</h1>
              {facility?.GEOJSON?.COORDINATES && (
                <a
                  href={`https://www.google.com/maps?q=${facility.GEOJSON.COORDINATES[1]},${facility.GEOJSON.COORDINATES[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="location-link"
                >
                  View on Maps
                </a>
              )}
            </div>
            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-label">TOTAL SITES</span>
                <span className="stat-value">{campsiteData.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">CELL SIGNAL</span>
                <span className="stat-value">Excellent</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">ELEV.</span>
                <span className="stat-value">1,500ft</span>
              </div>
              {facility?.FacilityPhone && (
                <div className="stat-item">
                  <span className="stat-label">PHONE</span>
                  <span className="stat-value">{facility.FacilityPhone}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="heatmap-section">
          <AvailabilityHeatmap facilityId={facilityID} campsites={campsiteData} />
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

        <div className="master-detail-layout">
          <div className="list-column" style={{ height: listHeight }}>
            <List
              height={listHeight}
              itemCount={filteredCampsites.length}
              itemSize={60}
              width="100%"
              itemData={{
                filteredCampsites,
                selectedCampsite,
                setSelectedCampsite,
              }}
            >
              {Row}
            </List>
          </div>
          <div className={`detail-column ${selectedCampsite ? "active" : ""}`}>
            <div
              className="close-sheet"
              onClick={() => setSelectedCampsite(null)}
            ></div>
            {selectedCampsite ? (
              <Campsite
                key={selectedCampsite.CampsiteID}
                campsite={selectedCampsite}
                facilityName={facilityName}
                isExpanded={true}
                showExpandHint={false}
                inline={true}
              />
            ) : (
              <div className="no-selection-placeholder">
                <p>Select a campsite from the list to view details</p>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => navigate("/")} className="back-button">
          <span className="back-arrow">←</span> Back to Search
        </button>
      </div>
    </>
  );
};

export default CampsitesPage;
