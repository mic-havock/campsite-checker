import { useState } from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/scss/image-gallery.scss";
import LoadingSpinner from "../common/LoadingSpinner/LoadingSpinner";
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
      <p>
        <strong>Facility Name:</strong> {facility.FacilityName}
      </p>
      <p>
        <strong>Facility Type:</strong> {facility.FacilityTypeDescription}
      </p>
      <p>
        <strong>Phone:</strong> {facility.FacilityPhone}
      </p>
      <p>
        <strong>Email:</strong>{" "}
        {facility.FacilityEmail ? facility.FacilityEmail : "None Available"}
      </p>
      <p>
        <strong>Longitude:</strong>{" "}
        {Array.isArray(facility.GEOJSON?.COORDINATES)
          ? facility.GEOJSON.COORDINATES[0]
          : "Not Available"}
      </p>
      <p>
        <strong>Latitude:</strong>{" "}
        {Array.isArray(facility.GEOJSON?.COORDINATES)
          ? facility.GEOJSON.COORDINATES[1]
          : "Not Available"}
      </p>
      <p>
        {Array.isArray(facility.GEOJSON?.COORDINATES) ? (
          <a
            href={`https://www.google.com/maps?q=${facility.GEOJSON.COORDINATES[1]},${facility.GEOJSON.COORDINATES[0]}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Google Maps
          </a>
        ) : null}
      </p>

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
    </div>
  );
};

export default FacilityDetails;
