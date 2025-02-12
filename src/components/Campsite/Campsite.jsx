import { useState } from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/scss/image-gallery.scss";
import "./campsite.scss";

const Campsite = ({ campsite }) => {
  const {
    CampsiteName,
    CampsiteReservable,
    CampsiteType,
    Loop,
    ENTITYMEDIA,
    ATTRIBUTES,
    PERMITTEDEQUIPMENT,
  } = campsite;
  const [isExpanded, setIsExpanded] = useState(false);
  console.log(JSON.stringify(campsite, null, 2));
  // Transform campsite media into format required by react-image-gallery
  const images =
    ENTITYMEDIA?.map((media) => ({
      original: media.URL,
      thumbnail: media.URL,
      description: media.Title,
      originalAlt: media.Title,
      thumbnailAlt: `Thumbnail of ${media.Title}`,
    })) || [];

  return (
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
            {CampsiteName} - {Loop}
          </h3>
          <div className="campsite-tags">
            {CampsiteReservable ? "Reservable" : "Not Reservable"}
            <br />
            {CampsiteType}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="overlay" onClick={() => setIsExpanded(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="media-section">
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
                <div className="no-image-container">No Images Available</div>
              )}
            </div>

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
                        {attribute.AttributeValue}
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
                        {equipment.EquipmentName}
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
