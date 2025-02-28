import PropTypes from "prop-types";
import { useState } from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/scss/image-gallery.scss";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import "./facility-details.scss";

const FacilityDetails = ({ facility, handleViewCampsites }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Transform facility media into format required by react-image-gallery
  const images =
    facility.MEDIA?.map((media) => ({
      original: media.URL,
      thumbnail: media.URL,
      description: media.Title,
      originalAlt: media.Title,
      thumbnailAlt: `Thumbnail of ${media.Title}`,
    })) || [];

  const handleCampsitesClick = async () => {
    setIsLoading(true);
    try {
      await handleViewCampsites();
    } finally {
      setIsLoading(false);
    }
  };

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

      <h2>Facility Details</h2>
      <table className="facility-details-table">
        <tbody>
          <tr>
            <td>
              <strong>Facility Name:</strong> {facility.FacilityName}
            </td>
            <td>
              <strong>Facility Type:</strong> {facility.FacilityTypeDescription}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Phone:</strong> {facility.FacilityPhone}
            </td>
            <td>
              <strong>Email:</strong>{" "}
              {facility.FacilityEmail
                ? facility.FacilityEmail
                : "None Available"}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Latitude, Longitude:</strong>{" "}
              {Array.isArray(facility.GEOJSON?.COORDINATES)
                ? facility.GEOJSON.COORDINATES[1]
                : "Not Available"}
              {", "}
              {Array.isArray(facility.GEOJSON?.COORDINATES)
                ? facility.GEOJSON.COORDINATES[0]
                : "Not Available"}
            </td>
            <td>
              {Array.isArray(facility.GEOJSON?.COORDINATES) ? (
                <a
                  href={`https://www.google.com/maps?q=${facility.GEOJSON.COORDINATES[1]},${facility.GEOJSON.COORDINATES[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Google Maps
                </a>
              ) : null}
            </td>
          </tr>
        </tbody>
      </table>

      <div
        dangerouslySetInnerHTML={{
          __html:
            facility.FacilityDescription || "<p>No description available</p>",
        }}
      />

      <h2>Directions</h2>
      <div
        dangerouslySetInnerHTML={{
          __html:
            facility.FacilityDirections || "<p>No directions available</p>",
        }}
      />

      <div className="media-section">
        <h2>Images</h2>
        {images.length > 0 ? (
          <ImageGallery
            items={images}
            showPlayButton={false}
            showFullscreenButton={true}
            showNav={true}
            thumbnailPosition="bottom"
            slideInterval={3000}
            slideDuration={450}
            lazyLoad={true}
            showIndex={true}
            onErrorImageURL="/placeholder-image.jpg"
          />
        ) : (
          <p>No images available</p>
        )}
      </div>
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

// Define PropTypes for the component
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
