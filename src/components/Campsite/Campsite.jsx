import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchCampsiteAvailability } from "../../api/campsites";
import ImageGallery from "../Common/ImageGallery/ImageGallery";
import CampsiteAvailability from "./CampsiteAvailability";
import "./campsite.scss";

//Campsite component that displays detailed information about a campsite
const Campsite = ({ campsite, facilityName }) => {
  const {
    CampsiteName,
    CampsiteReservable,
    CampsiteType,
    Loop,
    ENTITYMEDIA,
    ATTRIBUTES,
    PERMITTEDEQUIPMENT,
    CampsiteID,
  } = campsite;

  const [isExpanded, setIsExpanded] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  useEffect(() => {
    const loadAvailability = async () => {
      if (isExpanded && !availabilityData && !isLoadingAvailability) {
        setIsLoadingAvailability(true);
        try {
          const data = await fetchCampsiteAvailability(CampsiteID);
          setAvailabilityData(data.availability.availabilities);
        } catch (error) {
          setAvailabilityError("Failed to load availability data");
          console.error("Error loading availability:", error);
        } finally {
          setIsLoadingAvailability(false);
        }
      }
    };

    loadAvailability();
  }, [isExpanded, CampsiteID]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  const toTitleCase = (str) => {
    const exceptions = ["AM", "PM", "RV"];
    return str
      .split(" ")
      .map((word) => {
        if (exceptions.includes(word)) {
          return word;
        }
        // Handle words with slashes
        if (word.includes("/")) {
          return word
            .split("/")
            .map(
              (part) =>
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            )
            .join("/");
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  };

  // Transform campsite media into format required by react-image-gallery
  const images =
    ENTITYMEDIA?.map((media) => ({
      original: media.URL,
      thumbnail: media.URL,
      description: media.Title,
      originalAlt: media.Title,
      thumbnailAlt: `Thumbnail of ${media.Title}`,
    })) || [];

  // Modal component to be rendered with portal
  const Modal = () => {
    if (!isExpanded) return null;

    return createPortal(
      <div className="overlay" onClick={() => setIsExpanded(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <ImageGallery images={images} />

          <div className="modal-details">
            <div className="campsite-header">
              <h2>
                Campsite: {CampsiteName}
                {Loop && Loop.trim() ? ` - ${Loop}` : ""}{" "}
              </h2>
            </div>

            {ATTRIBUTES && ATTRIBUTES.length > 0 && (
              <div className="attributes-section">
                <h3>Campsite Details</h3>
                <div className="attributes-grid">
                  <div className="attribute-item">
                    <span className="attribute-name">TYPE: </span>
                    {toTitleCase(CampsiteType)}
                  </div>
                  <div className="attribute-item">
                    <span className="attribute-name">RESERVABLE: </span>
                    {CampsiteReservable ? "Reservable" : "Not Reservable"}
                  </div>
                  {ATTRIBUTES.map((attribute, index) => (
                    <div key={index} className="attribute-item">
                      <span className="attribute-name">
                        {attribute.AttributeName.toUpperCase()}:
                      </span>
                      {toTitleCase(attribute.AttributeValue)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {PERMITTEDEQUIPMENT && PERMITTEDEQUIPMENT.length > 0 && (
              <div className="attributes-section">
                <h3>Permitted Equipment</h3>
                <div className="attributes-grid">
                  {PERMITTEDEQUIPMENT.map((equipment, index) => (
                    <div key={index} className="attribute-item">
                      {toTitleCase(equipment.EquipmentName)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="attributes-section">
              <h3>Availability Calendar</h3>
              {isLoadingAvailability ? (
                <div className="availability-loading">
                  Loading availability...
                </div>
              ) : availabilityError ? (
                <div className="availability-error">{availabilityError}</div>
              ) : availabilityData ? (
                <CampsiteAvailability
                  availabilities={availabilityData}
                  facilityName={facilityName}
                  campsiteNumber={CampsiteName}
                  campsiteId={CampsiteID}
                  campsite={campsite}
                />
              ) : null}
            </div>
          </div>

          <a
            href={`https://www.recreation.gov/camping/campsites/${CampsiteID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="recreation-link"
          >
            View on Recreation.gov →
          </a>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="campsite-card">
        <div className="campsite-content" onClick={() => setIsExpanded(true)}>
          {images.length > 0 ? (
            <img
              src={images[0].original}
              alt={images[0].originalAlt}
              className="campsite-thumbnail"
            />
          ) : (
            <div className="no-image-container">No Image Available</div>
          )}

          <div className="campsite-info">
            <h3>
              {CampsiteName}
              {Loop && Loop.trim() ? ` - ${Loop}` : ""}
            </h3>
            <div className="campsite-tags">
              {toTitleCase(CampsiteType)} -{" "}
              {CampsiteReservable ? "Reservable" : "Not Reservable"}
            </div>
          </div>
        </div>
      </div>
      <Modal />
    </>
  );
};

Campsite.propTypes = {
  campsite: PropTypes.shape({
    CampsiteName: PropTypes.string.isRequired,
    CampsiteReservable: PropTypes.bool.isRequired,
    CampsiteType: PropTypes.string.isRequired,
    Loop: PropTypes.string,
    ENTITYMEDIA: PropTypes.arrayOf(
      PropTypes.shape({
        URL: PropTypes.string.isRequired,
        Title: PropTypes.string.isRequired,
      })
    ),
    ATTRIBUTES: PropTypes.arrayOf(
      PropTypes.shape({
        AttributeName: PropTypes.string.isRequired,
        AttributeValue: PropTypes.string.isRequired,
      })
    ),
    PERMITTEDEQUIPMENT: PropTypes.arrayOf(
      PropTypes.shape({
        EquipmentName: PropTypes.string.isRequired,
      })
    ),
    CampsiteID: PropTypes.string.isRequired,
  }).isRequired,
  facilityName: PropTypes.string.isRequired,
};

export default Campsite;
