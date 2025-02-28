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
    CampsiteID,
  } = campsite;
  const [isExpanded, setIsExpanded] = useState(false);

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
            {CampsiteName}
            {Loop && Loop.trim() ? ` - ${Loop}` : ""}
          </h3>
          <div className="campsite-tags">
            {toTitleCase(CampsiteType)} -{" "}
            {CampsiteReservable ? "Reservable" : "Not Reservable"}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="overlay" onClick={() => setIsExpanded(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
              <div className="campsite-header">
                <h2>
                  Campsite: {CampsiteName}
                  {Loop && Loop.trim() ? ` - ${Loop}` : ""}{" "}
                </h2>
                <a
                  href={`https://www.recreation.gov/camping/campsites/${CampsiteID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="recreation-link"
                >
                  View on Recreation.gov →
                </a>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campsite;
