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
import "./facilities-map.scss";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const MapUpdater = ({ center, zoom, shouldUpdate }) => {
  const map = useMap();
  const hasUpdatedRef = useRef(false);

  useEffect(() => {
    if (center && zoom && shouldUpdate && !hasUpdatedRef.current) {
      map.setView(center, zoom);
      hasUpdatedRef.current = true;
    } else if (center && zoom && shouldUpdate) {
       map.setView(center, zoom);
    }
  }, [map, center, zoom, shouldUpdate]);

  return null;
};

MapUpdater.propTypes = {
  center: PropTypes.array.isRequired,
  zoom: PropTypes.number.isRequired,
  shouldUpdate: PropTypes.bool.isRequired,
};

const FacilitiesMap = ({ facilities, onFacilitySelect }) => {
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Default center of US
  const [zoom, setZoom] = useState(4);
  const [hasValidCoordinates, setHasValidCoordinates] = useState(false);
  const [facilitiesWithCoords, setFacilitiesWithCoords] = useState([]);
  const [initialMapSetup, setInitialMapSetup] = useState(false);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const previousFacilitiesLength = useRef(0);

  useEffect(() => {
    if (
      facilities &&
      facilities.length > 0 &&
      (!initialMapSetup ||
        Math.abs(facilities.length - previousFacilitiesLength.current) > 0)
    ) {
      const validFacilities = facilities.filter(
        (facility) =>
          facility.FacilityLatitude &&
          facility.FacilityLongitude &&
          !isNaN(parseFloat(facility.FacilityLatitude)) &&
          !isNaN(parseFloat(facility.FacilityLongitude))
      );

      previousFacilitiesLength.current = facilities.length;

      if (validFacilities.length > 0) {
        setHasValidCoordinates(true);

        const totalLat = validFacilities.reduce(
          (sum, facility) => sum + parseFloat(facility.FacilityLatitude),
          0
        );
        const totalLng = validFacilities.reduce(
          (sum, facility) => sum + parseFloat(facility.FacilityLongitude),
          0
        );

        const avgLat = totalLat / validFacilities.length;
        const avgLng = totalLng / validFacilities.length;

        setMapCenter([avgLat, avgLng]);

        if (validFacilities.length === 1) {
            setZoom(10);
        } else {
            setZoom(6);
        }

        setInitialMapSetup(true);
      } else {
        setHasValidCoordinates(false);
      }
    } else if (!facilities || facilities.length === 0) {
      setHasValidCoordinates(false);
    }

    if (facilities && facilities.length > 0) {
      const validFacilities = facilities.filter(
        (facility) =>
          facility.FacilityLatitude &&
          facility.FacilityLongitude &&
          !isNaN(parseFloat(facility.FacilityLatitude)) &&
          !isNaN(parseFloat(facility.FacilityLongitude))
      );
      setFacilitiesWithCoords(validFacilities);
    } else {
        setFacilitiesWithCoords([]);
    }
  }, [facilities, initialMapSetup]);

  if (!hasValidCoordinates && facilities && facilities.length > 0) {
    return (
      <div className="no-map-container">
        <p>No location data available for these facilities.</p>
      </div>
    );
  }

  if (!facilities || facilities.length === 0) {
     return null;
  }

  return (
    <div className="facilities-map-container">
      <div className="map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: "600px", width: "100%" }}
        >
          <div className="map-controls leaflet-top leaflet-right">
            <button
              onClick={(e) => {
                  e.stopPropagation();
                  setIsSatelliteView(!isSatelliteView);
              }}
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
            shouldUpdate={true}
          />

          {facilitiesWithCoords.map((facility) => (
            <Marker
              key={facility.FacilityID}
              position={[
                parseFloat(facility.FacilityLatitude),
                parseFloat(facility.FacilityLongitude),
              ]}
              eventHandlers={{
                click: () => {
                    if (onFacilitySelect) {
                        onFacilitySelect(facility);
                    }
                },
              }}
            >
              <Tooltip permanent={false} direction="top">
                {facility.FacilityName}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

FacilitiesMap.propTypes = {
  facilities: PropTypes.array.isRequired,
  onFacilitySelect: PropTypes.func,
};

export default FacilitiesMap;
