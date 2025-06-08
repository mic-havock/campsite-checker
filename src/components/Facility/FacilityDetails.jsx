import PropTypes from "prop-types";
import { useState } from "react";
import ImageGallery from "../Common/ImageGallery/ImageGallery";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import "./facility-details.scss";
import FacilityMap from "./Map/FacilityMap";

const transformMedia = (media = []) =>
  media.map(({ URL, Title }) => ({
    original: URL,
    thumbnail: URL,
    description: Title,
    originalAlt: Title,
    thumbnailAlt: `Thumbnail of ${Title}`,
  }));

const formatCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;
  const [longitude, latitude] = coordinates;
  return {
    display: `${latitude}, ${longitude}`,
    mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
  };
};

const FacilityInfoRow = ({ label, value, secondLabel, secondValue }) => (
  <tr>
    <td>
      <strong>{label}:</strong> {value}
    </td>
    {secondLabel && (
      <td>
        <strong>{secondLabel}:</strong> {secondValue}
      </td>
    )}
  </tr>
);

FacilityInfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  secondLabel: PropTypes.string,
  secondValue: PropTypes.node,
};

const FacilityDetails = ({ facility, handleViewCampsites }) => {
  const [isLoading, setIsLoading] = useState(false);

  const processFacilityDescription = (description) => {
    if (!description) return "<p>No description available</p>";
    return description.replace(/contact_info/g, "Contact Info");
  };

  const handleCampsitesClick = async () => {
    setIsLoading(true);
    try {
      await handleViewCampsites();
    } finally {
      setIsLoading(false);
    }
  };

  const coordinates = formatCoordinates(facility.GEOJSON?.COORDINATES);
  const images = transformMedia(facility.MEDIA);

  return (
    <div className="facility-details">
      {isLoading && <LoadingSpinner fullPage />}

      <div className="view-campsites-wrapper">
        <button
          className="camground-btn"
          onClick={handleCampsitesClick}
          disabled={!facility || isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="small" />
              <span style={{ marginLeft: "8px" }}>Loading...</span>
            </>
          ) : (
            "View Campsites"
          )}
        </button>
      </div>

      <h2>Campground Details</h2>
      <table className="facility-details-table">
        <tbody>
          <FacilityInfoRow
            label="Campground Name"
            value={facility.FacilityName}
            secondLabel="Facility Type"
            secondValue={facility.FacilityTypeDescription}
          />
          <FacilityInfoRow
            label="Phone"
            value={facility.FacilityPhone}
            secondLabel="Email"
            secondValue={facility.FacilityEmail || "None Available"}
          />
          <FacilityInfoRow
            label="Latitude, Longitude"
            value={coordinates?.display || "Not Available"}
            secondValue={
              coordinates && (
                <a
                  href={coordinates.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Google Maps
                </a>
              )
            }
          />
        </tbody>
      </table>

      <div
        dangerouslySetInnerHTML={{
          __html: processFacilityDescription(facility.FacilityDescription),
        }}
      />

      <section className="directions-section">
        <h2>Directions</h2>
        <div
          dangerouslySetInnerHTML={{
            __html: facility.FacilityDirections || "No directions available",
          }}
        />
      </section>

      <section className="map-section">
        <h2>Location</h2>
        <FacilityMap facility={facility} />
      </section>

      <section className="media-section">
        <h2>Images</h2>
        <ImageGallery images={images} />
      </section>

      <a
        href={`https://www.recreation.gov/camping/campgrounds/${facility.FacilityID}`}
        target="_blank"
        rel="noopener noreferrer"
        className="recreation-link"
      >
        View on Recreation.gov →
      </a>
    </div>
  );
};

FacilityDetails.propTypes = {
  facility: PropTypes.shape({
    FacilityID: PropTypes.string.isRequired,
    FacilityName: PropTypes.string.isRequired,
    FacilityTypeDescription: PropTypes.string,
    FacilityPhone: PropTypes.string,
    FacilityEmail: PropTypes.string,
    FacilityDescription: PropTypes.string,
    FacilityDirections: PropTypes.string,
    MEDIA: PropTypes.arrayOf(
      PropTypes.shape({
        URL: PropTypes.string.isRequired,
        Title: PropTypes.string,
      })
    ),
    GEOJSON: PropTypes.shape({
      COORDINATES: PropTypes.array,
    }),
  }).isRequired,
  handleViewCampsites: PropTypes.func.isRequired,
};

export default FacilityDetails;
