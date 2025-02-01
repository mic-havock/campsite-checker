import { useState } from "react";
import "./campsite.scss";

const Campsite = ({ campsite }) => {
  const {
    CampsiteName,
    CampsiteReservable,
    CampsiteType,
    ENTITYMEDIA,
    ATTRIBUTES,
  } = campsite;
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const thumbnail = ENTITYMEDIA?.[currentImageIndex]?.URL;

  const handleClose = (e) => {
    if (e.target.classList.contains("overlay")) {
      setIsExpanded(false);
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % ENTITYMEDIA.length);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? ENTITYMEDIA.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="campsite-card">
      <div className="campsite-content" onClick={() => setIsExpanded(true)}>
        {thumbnail && (
          <div className="image-container">
            <img
              src={thumbnail}
              alt={`${CampsiteName} thumbnail`}
              className="campsite-thumbnail"
            />
          </div>
        )}

        <div className="campsite-info">
          <h3>
            {CampsiteName} -{" "}
            {CampsiteReservable ? "Reservable" : "Not Reservable"}
          </h3>
          <div className="campsite-tags">{CampsiteType}</div>
        </div>
      </div>

      {isExpanded && (
        <div className="overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close"
            >
              ×
            </button>

            {thumbnail && (
              <div className="image-slider">
                {ENTITYMEDIA.length > 1 && (
                  <button
                    className="nav-button prev-button"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                )}
                <img
                  src={thumbnail}
                  alt={`${CampsiteName} view ${currentImageIndex + 1}`}
                  className="slider-image"
                />
                {ENTITYMEDIA.length > 1 && (
                  <button
                    className="nav-button next-button"
                    onClick={handleNextImage}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                )}
                <div className="image-counter">
                  {currentImageIndex + 1}/{ENTITYMEDIA.length}
                </div>
              </div>
            )}

            <div className="modal-details">
              <h2>Campsite: {CampsiteName}</h2>
              <div className="campsite-tags">
                {CampsiteType} -{" "}
                {CampsiteReservable ? "Reservable" : "Not Reservable"}
              </div>

              {ATTRIBUTES && ATTRIBUTES.length > 0 && (
                <div className="attributes-section">
                  <h3>Campsite Details</h3>
                  <div className="attributes-grid">
                    {ATTRIBUTES.map((attribute, index) => (
                      <div key={index} className="attribute-item">
                        <span className="attribute-name">
                          {attribute.AttributeName}:
                        </span>
                        <span className="attribute-value">
                          {attribute.AttributeValue}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campsite;
