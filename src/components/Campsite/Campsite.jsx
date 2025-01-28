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
    if (e.target.classList.contains("expanded")) {
      setIsExpanded(false);
    }
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % ENTITYMEDIA.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? ENTITYMEDIA.length - 1 : prevIndex - 1
    );
  };

  return (
    <div
      className={`campsite-tile ${isExpanded ? "expanded" : ""}`}
      onClick={(e) => {
        if (!isExpanded) setIsExpanded(true);
      }}
    >
      {isExpanded && (
        <div className="overlay" onClick={handleClose}>
          <div
            className="expanded-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setIsExpanded(false)}
            >
              Close
            </button>

            {thumbnail && (
              <div className="image-slider">
                <button
                  className="prev-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                >
                  &lt;
                </button>
                <img
                  src={thumbnail}
                  alt={`Image ${currentImageIndex + 1}`}
                  className="slider-image"
                />
                <button
                  className="next-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                >
                  &gt;
                </button>
              </div>
            )}

            <h3>{CampsiteName}</h3>
            <p>Type: {CampsiteType}</p>
            <p>Reservable: {CampsiteReservable ? "Yes" : "No"}</p>

            {ATTRIBUTES && (
              <div className="campsite-details">
                <h4>Details</h4>
                <ul>
                  {ATTRIBUTES.map((attribute, index) => (
                    <li
                      key={index}
                    >{`${attribute.AttributeName}: ${attribute.AttributeValue}`}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!isExpanded && thumbnail && (
        <img
          src={thumbnail}
          alt={`${CampsiteName} thumbnail`}
          className="campsite-thumbnail"
        />
      )}

      {!isExpanded && (
        <div>
          <h3>{CampsiteName}</h3>
          <p>Type: {CampsiteType}</p>
          <p>Reservable: {CampsiteReservable ? "Yes" : "No"}</p>
        </div>
      )}
    </div>
  );
};

export default Campsite;
