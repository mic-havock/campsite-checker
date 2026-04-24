import { useEffect } from "react";
import { useMap } from "react-leaflet";
import PropTypes from "prop-types";

/**
 * MapUpdater component to programmatically update the Leaflet map view.
 * This is needed because MapContainer center and zoom props are only used for initial render.
 */
const MapUpdater = ({ center, zoom, shouldUpdate = true }) => {
  const map = useMap();

  useEffect(() => {
    if (shouldUpdate && center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom, shouldUpdate]);

  return null;
};

MapUpdater.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
  shouldUpdate: PropTypes.bool,
};

export default MapUpdater;
