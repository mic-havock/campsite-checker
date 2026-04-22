import PropTypes from "prop-types";
import "./facility-card.scss";

const FacilityCard = ({ facility, onClick }) => {
  const {
    FacilityName,
    FacilityTypeDescription,
    FacilityPhone,
    FacilityEmail,
    FacilityCity,
    FacilityStateCode,
  } = facility;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="facility-card"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="facility-card__header">
        <h3 className="facility-card__title">{FacilityName}</h3>
        <span className="facility-card__type">{FacilityTypeDescription}</span>
      </div>

      <div className="facility-card__body">
        <div className="facility-card__info">
          <span className="label">Location:</span>
          <span className="value">{FacilityCity ? `${FacilityCity}, ${FacilityStateCode}` : FacilityStateCode || "N/A"}</span>
        </div>
        <div className="facility-card__info">
          <span className="label">Contact:</span>
          <span className="value">{FacilityPhone || FacilityEmail || "N/A"}</span>
        </div>

        <div className="facility-card__stats">
          <div className="stat">
            <span className="label">Availability</span>
            <span className="value availability-tag">Check Dates</span>
          </div>
          <div className="stat">
            <span className="label">Price Range</span>
            <span className="value price-tag">$25 - $45</span>
          </div>
        </div>
      </div>

      <div className="facility-card__footer">
        <button className="view-details-btn">View Details</button>
      </div>
    </div>
  );
};

FacilityCard.propTypes = {
  facility: PropTypes.shape({
    FacilityID: PropTypes.string.isRequired,
    FacilityName: PropTypes.string.isRequired,
    FacilityTypeDescription: PropTypes.string,
    FacilityPhone: PropTypes.string,
    FacilityEmail: PropTypes.string,
    FacilityCity: PropTypes.string,
    FacilityStateCode: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default FacilityCard;
