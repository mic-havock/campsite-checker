import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import Campsite from "../Campsite";
import "./campsite-map.scss";

// Fix for Leaflet marker icons in React
// This is needed because Leaflet's default icon paths are not compatible with React's build system
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

/**
 * MapUpdater component to update the map view when center or zoom changes
 * Only used for initial setup, not for filter changes
 *
 * @param {Object} props - Component props
 * @param {Array} props.center - Center coordinates [lat, lng]
 * @param {number} props.zoom - Zoom level
 * @param {boolean} props.shouldUpdate - Whether to update the map view
 * @returns {null} - This component doesn't render anything
 */
const MapUpdater = ({ center, zoom, shouldUpdate }) => {
  const map = useMap();
  const hasUpdatedRef = useRef(false);

  useEffect(() => {
    // Only update the map view on initial load, not when filters change
    if (center && zoom && shouldUpdate && !hasUpdatedRef.current) {
      map.setView(center, zoom);
      hasUpdatedRef.current = true;
    }
  }, [map, center, zoom, shouldUpdate]);

  return null;
};

MapUpdater.propTypes = {
  center: PropTypes.array.isRequired,
  zoom: PropTypes.number.isRequired,
  shouldUpdate: PropTypes.bool.isRequired,
};

/**
 * CampsiteMap component displays a map with markers for each campsite location
 *
 * @param {Object} props - Component props
 * @param {Array} props.campsites - Array of campsite objects with location data
 * @param {string} props.facilityName - Name of the facility/campground
 * @returns {JSX.Element} - Rendered component
 */
const CampsiteMap = ({ campsites, facilityName }) => {
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Default center of US
  const [zoom, setZoom] = useState(4);
  const [hasValidCoordinates, setHasValidCoordinates] = useState(false);
  const [sitesWithCoords, setSitesWithCoords] = useState([]);
  const [initialMapSetup, setInitialMapSetup] = useState(false);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [selectedCampsite, setSelectedCampsite] = useState(null);
  const previousCampsitesLength = useRef(0);

  useEffect(() => {
    // Calculate the center of the map based on campsite coordinates
    // Only do this on initial load or when the total dataset changes significantly
    if (
      campsites &&
      campsites.length > 0 &&
      (!initialMapSetup ||
        Math.abs(campsites.length - previousCampsitesLength.current) > 5)
    ) {
      // Filter campsites with valid coordinates
      const validSites = campsites.filter(
        (site) =>
          site.CampsiteLatitude &&
          site.CampsiteLongitude &&
          !isNaN(parseFloat(site.CampsiteLatitude)) &&
          !isNaN(parseFloat(site.CampsiteLongitude))
      );

      // Update the reference to the previous length
      previousCampsitesLength.current = campsites.length;

      if (validSites.length > 0) {
        setHasValidCoordinates(true);

        // Only calculate center and zoom if this is the initial setup
        if (!initialMapSetup) {
          // Calculate the average lat/lng as the center
          const totalLat = validSites.reduce(
            (sum, site) => sum + parseFloat(site.CampsiteLatitude),
            0
          );
          const totalLng = validSites.reduce(
            (sum, site) => sum + parseFloat(site.CampsiteLongitude),
            0
          );

          const avgLat = totalLat / validSites.length;
          const avgLng = totalLng / validSites.length;

          setMapCenter([avgLat, avgLng]);
          setZoom(17);
          setInitialMapSetup(true);
        }
      } else {
        setHasValidCoordinates(false);
      }
    } else if (!campsites || campsites.length === 0) {
      setHasValidCoordinates(false);
    }

    // Always update the sites with coordinates for markers
    if (campsites && campsites.length > 0) {
      const validSites = campsites.filter(
        (site) =>
          site.CampsiteLatitude &&
          site.CampsiteLongitude &&
          !isNaN(parseFloat(site.CampsiteLatitude)) &&
          !isNaN(parseFloat(site.CampsiteLongitude))
      );
      setSitesWithCoords(validSites);
    }
  }, [campsites, initialMapSetup]);

  if (!hasValidCoordinates) {
    return (
      <div className="no-map-container">
        <p>No location data available for these campsites.</p>
      </div>
    );
  }

  return (
    <div className="campsite-map-container">
      <h2>{facilityName} Map</h2>
      <div className="map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: "600px", width: "100%" }}
        >
          <div className="map-controls leaflet-top leaflet-right">
            <button
              onClick={() => setIsSatelliteView(!isSatelliteView)}
              className="view-toggle-button leaflet-control"
            >
              {isSatelliteView ? "Standard View" : "Satellite View"}
            </button>
          </div>

          <TileLayer
            attribution={
              isSatelliteView
                ? "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
            url={
              isSatelliteView
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
          />

          <MapUpdater
            center={mapCenter}
            zoom={zoom}
            shouldUpdate={!initialMapSetup}
          />

          {sitesWithCoords.map((site) => (
            <Marker
              key={site.CampsiteID}
              position={[
                parseFloat(site.CampsiteLatitude),
                parseFloat(site.CampsiteLongitude),
              ]}
              eventHandlers={{
                click: () => setSelectedCampsite(site),
              }}
            >
              <Tooltip permanent={false} direction="top">
                {site.CampsiteName}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {selectedCampsite && (
        <div
          className="selected-campsite-overlay"
          onClick={() => setSelectedCampsite(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Campsite campsite={selectedCampsite} facilityName={facilityName} />
          </div>
        </div>
      )}
    </div>
  );
};

// PropTypes validation
CampsiteMap.propTypes = {
  campsites: PropTypes.arrayOf(
    PropTypes.shape({
      CampsiteID: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      CampsiteName: PropTypes.string.isRequired,
      CampsiteLatitude: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      CampsiteLongitude: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      CampsiteType: PropTypes.string,
      CampsiteReservable: PropTypes.bool,
      Loop: PropTypes.string,
    })
  ).isRequired,
  facilityName: PropTypes.string.isRequired,
};

export default CampsiteMap;
