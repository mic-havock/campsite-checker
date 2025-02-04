import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner/LoadingSpinner";
import "./facility-details.scss";

const FacilityDetails = ({ facility, handleViewCampsites }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Open image modal
  const openImageModal = (imageUrl, index) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation(); // Add this to prevent event bubbling
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? facility.MEDIA.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = (e) => {
    e.stopPropagation(); // Add this to prevent event bubbling
    setCurrentImageIndex((prevIndex) =>
      prevIndex === facility.MEDIA.length - 1 ? 0 : prevIndex + 1
    );
  };

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
        <strong>Longitude:</strong>{" "}
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
      {/* Render Description as HTML */}
      <div
        dangerouslySetInnerHTML={{
          __html:
            facility.FacilityDescription || "<p>No description available</p>",
        }}
      />
      <h2>Directions</h2>
      {/* Render Directions as HTML */}
      <div
        dangerouslySetInnerHTML={{
          __html:
            facility.FacilityDirections || "<p>No directions available</p>",
        }}
      />
      {/* Render Images */}
      <div className="media-section">
        <h2>Images</h2>
        {facility.MEDIA && facility.MEDIA.length > 0 ? (
          <div className="media-grid">
            {facility.MEDIA.map((media, index) => (
              <div key={media.EntityMediaID} className="media-item">
                <img
                  src={media.URL}
                  alt={media.Title}
                  onClick={() => openImageModal(media.URL, index)}
                />
                <p>{media.Title}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No images available</p>
        )}
      </div>

      {isModalOpen && (
        <div className="overlay" onClick={closeImageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
              aria-label="Close"
            >
              X
            </button>

            <div className="image-slider" onClick={(e) => e.stopPropagation()}>
              {facility.MEDIA.length > 1 && (
                <button
                  className="nav-button prev-button"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                />
              )}
              <img
                src={facility.MEDIA[currentImageIndex].URL}
                alt={facility.MEDIA[currentImageIndex].Title}
                className="slider-image"
                onClick={(e) => e.stopPropagation()}
              />
              {facility.MEDIA.length > 1 && (
                <button
                  className="nav-button next-button"
                  onClick={handleNextImage}
                  aria-label="Next image"
                />
              )}

              <div className="image-caption">
                {facility.MEDIA[currentImageIndex].Title}
              </div>

              <div className="image-counter">
                {currentImageIndex + 1}/{facility.MEDIA.length}
              </div>

              <div className="thumbnails-nav">
                {facility.MEDIA.map((media, index) => (
                  <img
                    key={media.EntityMediaID}
                    src={media.URL}
                    alt={`Thumbnail ${index + 1}`}
                    className={`thumbnail ${
                      index === currentImageIndex ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityDetails;
