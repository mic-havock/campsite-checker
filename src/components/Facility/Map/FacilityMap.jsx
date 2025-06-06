import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "./facility-map.scss";

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

MapUpdater.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
};

const FacilityMap = ({ facility }) => {
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [zoomLevel] = useState(14);
  const [isSatellite, setIsSatellite] = useState(false);

  useEffect(() => {
    if (facility?.GEOJSON?.COORDINATES) {
      const [longitude, latitude] = facility.GEOJSON.COORDINATES;
      setMapCenter([latitude, longitude]);
    }
  }, [facility]);

  if (!facility?.GEOJSON?.COORDINATES) {
    return (
      <div className="no-map-container">
        <p>No map coordinates available for this facility.</p>
      </div>
    );
  }

  const [longitude, latitude] = facility.GEOJSON.COORDINATES;

  return (
    <div className="facility-map-container">
      <div className="map-controls">
        <button
          className="view-toggle-button"
          onClick={() => setIsSatellite(!isSatellite)}
        >
          {isSatellite ? "Standard View" : "Satellite View"}
        </button>
      </div>
      <div className="map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer
            url={
              isSatellite
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            attribution={
              isSatellite
                ? "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
          />
          <Marker position={[latitude, longitude]}>
            <Popup>
              <div>
                <h3>{facility.FacilityName}</h3>
                <p>{facility.FacilityTypeDescription}</p>
                {facility.FacilityPhone && (
                  <p>Phone: {facility.FacilityPhone}</p>
                )}
              </div>
            </Popup>
          </Marker>
          <MapUpdater center={mapCenter} zoom={zoomLevel} />
        </MapContainer>
      </div>
    </div>
  );
};

FacilityMap.propTypes = {
  facility: PropTypes.shape({
    FacilityName: PropTypes.string.isRequired,
    FacilityTypeDescription: PropTypes.string,
    FacilityPhone: PropTypes.string,
    GEOJSON: PropTypes.shape({
      COORDINATES: PropTypes.arrayOf(PropTypes.number).isRequired,
    }),
  }).isRequired,
};

export default FacilityMap;
