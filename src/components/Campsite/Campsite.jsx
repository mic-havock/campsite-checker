import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { fetchCampsiteAvailability } from "../../api/campsites";
import { toTitleCase } from "../../utils/stringUtils";
import ImageGallery from "../Common/ImageGallery/ImageGallery";
import "./campsite.scss";
import CampsiteAvailability from "./CampsiteAvailability";

const useAvailabilityData = (campsiteId, isExpanded) => {
  const [availabilityData, setAvailabilityData] = useState(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  useEffect(() => {
    const loadAvailability = async () => {
      if (isExpanded && !availabilityData && !isLoadingAvailability) {
        setIsLoadingAvailability(true);
        try {
          const data = await fetchCampsiteAvailability(campsiteId);
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
  }, [isExpanded, campsiteId, availabilityData, isLoadingAvailability]);

  return { availabilityData, isLoadingAvailability, availabilityError };
};

const CampsiteModal = ({
  isExpanded,
  onClose,
  images,
  campsite,
  facilityName,
  availabilityData,
  isLoadingAvailability,
  availabilityError,
}) => {
  if (!isExpanded) return null;

  const {
    CampsiteName,
    CampsiteReservable,
    CampsiteType,
    Loop,
    ATTRIBUTES,
    PERMITTEDEQUIPMENT,
    CampsiteID,
  } = campsite;

  return createPortal(
    <div className="overlay" onClick={onClose}>
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

CampsiteModal.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  images: PropTypes.arrayOf(
    PropTypes.shape({
      original: PropTypes.string.isRequired,
      thumbnail: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      originalAlt: PropTypes.string.isRequired,
      thumbnailAlt: PropTypes.string.isRequired,
    })
  ).isRequired,
  campsite: PropTypes.object.isRequired,
  facilityName: PropTypes.string.isRequired,
  availabilityData: PropTypes.object,
  isLoadingAvailability: PropTypes.bool.isRequired,
  availabilityError: PropTypes.string,
};

const Campsite = ({
  campsite,
  facilityName,
  isExpanded: initialIsExpanded = false,
}) => {
  const {
    CampsiteName,
    CampsiteReservable,
    CampsiteType,
    Loop,
    ENTITYMEDIA,
    CampsiteID,
  } = campsite;

  const [isExpanded, setIsExpanded] = useState(initialIsExpanded);
  const { availabilityData, isLoadingAvailability, availabilityError } =
    useAvailabilityData(CampsiteID, isExpanded);

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

  const images = useMemo(
    () =>
      ENTITYMEDIA?.map((media) => ({
        original: media.URL,
        thumbnail: media.URL,
        description: media.Title,
        originalAlt: media.Title,
        thumbnailAlt: `Thumbnail of ${media.Title}`,
      })) || [],
    [ENTITYMEDIA]
  );

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
      <CampsiteModal
        isExpanded={isExpanded}
        onClose={() => setIsExpanded(false)}
        images={images}
        campsite={campsite}
        facilityName={facilityName}
        availabilityData={availabilityData}
        isLoadingAvailability={isLoadingAvailability}
        availabilityError={availabilityError}
      />
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
  isExpanded: PropTypes.bool,
};

export default Campsite;
