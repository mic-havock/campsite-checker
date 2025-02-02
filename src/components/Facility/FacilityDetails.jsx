import { useState } from "react";

const FacilityDetails = ({ facility, handleViewCampsites }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "10px",
        border: "1px solid #ccc",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10,
        }}
      >
        <button onClick={handleViewCampsites} disabled={!facility}>
          View Campsites
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
      <div style={{ marginTop: "20px" }}>
        <h2>Images</h2>
        {facility.MEDIA && facility.MEDIA.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {facility.MEDIA.map((media, index) => (
              <div
                key={media.EntityMediaID}
                style={{ margin: "10px", width: "200px" }}
              >
                <img
                  src={media.URL}
                  alt={media.Title}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "5px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    cursor: "pointer",
                  }}
                  onClick={() => openImageModal(media.URL, index)} // Open image in modal when clicked
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
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // Add this to prevent modal closing
          >
            <button
              className="close-button"
              onClick={(e) => {
                e.stopPropagation(); // Add this to prevent event bubbling
                setIsModalOpen(false);
              }}
              aria-label="Close"
            >
              X
            </button>

            <div
              className="image-slider"
              onClick={(e) => e.stopPropagation()} // Add this to prevent modal closing
            >
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
                onClick={(e) => e.stopPropagation()} // Add this to prevent modal closing
              />
              {facility.MEDIA.length > 1 && (
                <button
                  className="nav-button next-button"
                  onClick={handleNextImage}
                  aria-label="Next image"
                />
              )}

              <div
                className="image-caption"
                onClick={(e) => e.stopPropagation()} // Add this to prevent modal closing
              >
                {facility.MEDIA[currentImageIndex].Title}
              </div>

              <div
                className="image-counter"
                onClick={(e) => e.stopPropagation()} // Add this to prevent modal closing
              >
                {currentImageIndex + 1}/{facility.MEDIA.length}
              </div>

              <div
                className="thumbnails-nav"
                onClick={(e) => e.stopPropagation()} // Add this to prevent modal closing
              >
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
