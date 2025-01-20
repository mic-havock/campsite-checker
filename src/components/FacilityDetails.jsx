import { useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"; // Use FontAwesome icons for arrows
import Modal from "react-modal";

// Modal styles
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    padding: "20px",
    maxWidth: "90%",
    maxHeight: "90%",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between", // Ensure content is spaced between
    alignItems: "center", // Center align everything
  },
};

const FacilityDetails = ({ facility }) => {
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

  // Navigate to the previous image
  const goToPreviousImage = () => {
    const previousIndex =
      currentImageIndex === 0
        ? facility.MEDIA.length - 1
        : currentImageIndex - 1;
    setSelectedImage(facility.MEDIA[previousIndex].URL);
    setCurrentImageIndex(previousIndex);
  };

  // Navigate to the next image
  const goToNextImage = () => {
    const nextIndex =
      currentImageIndex === facility.MEDIA.length - 1
        ? 0
        : currentImageIndex + 1;
    setSelectedImage(facility.MEDIA[nextIndex].URL);
    setCurrentImageIndex(nextIndex);
  };

  return (
    <div
      style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}
    >
      <h3>Facility Details</h3>
      <p>
        <strong>Name:</strong> {facility.FacilityName}
      </p>
      <p>
        <strong>ID:</strong> {facility.FacilityID}
      </p>
      <p>
        <strong>Latitude:</strong> {facility.GEOJSON?.COORDINATES[1]}
      </p>
      <p>
        <strong>Longitude:</strong> {facility.GEOJSON?.COORDINATES[0]}
      </p>
      <p>
        <strong>Type:</strong> {facility.FacilityTypeDescription}
      </p>
      <p>
        <strong>Phone:</strong> {facility.FacilityPhone}
      </p>
      {/* Render Description as HTML */}
      <div
        dangerouslySetInnerHTML={{
          __html:
            facility.FacilityDescription || "<p>No description available</p>",
        }}
      />
      <p>
        <strong>Address:</strong> {facility.FACILITYADDRESS}
      </p>
      {/* Render Directions as HTML */}
      <div
        dangerouslySetInnerHTML={{
          __html:
            facility.FacilityDirections || "<p>No directions available</p>",
        }}
      />
      <p>
        <strong>Email:</strong> {facility.FacilityEmail}
      </p>

      {/* Render Images */}
      <div style={{ marginTop: "20px" }}>
        <h4>Images:</h4>
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

      {/* Modal for image */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeImageModal}
        style={customStyles}
        contentLabel="Image Modal"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          {/* Navigation Arrows */}
          <button onClick={goToPreviousImage} style={arrowStyle}>
            <FaArrowLeft />
          </button>

          {/* Displaying the selected image */}
          <img
            src={selectedImage}
            alt="Selected"
            style={{ maxWidth: "100%", maxHeight: "100%", margin: "10px 0" }}
          />

          <button onClick={goToNextImage} style={arrowStyle}>
            <FaArrowRight />
          </button>
        </div>

        {/* Close button */}
        <button onClick={closeImageModal} style={closeButtonStyle}>
          Close
        </button>
      </Modal>
    </div>
  );
};

// Styling for navigation arrows
const arrowStyle = {
  backgroundColor: "#fff",
  border: "1px solid #ccc",
  borderRadius: "50%",
  fontSize: "20px",
  padding: "15px", // Increase padding for better button size
  cursor: "pointer",
  margin: "0 20px", // Adjust space between arrows
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  display: "inline-block",
  alignSelf: "center", // Vertically align the arrows
  flex: "none",
};

// Close button style
const closeButtonStyle = {
  marginTop: "10px",
  padding: "10px 20px",
  backgroundColor: "#007BFF",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  alignSelf: "center",
};

export default FacilityDetails;
