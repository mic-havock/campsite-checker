import React, { useState } from "react";
import "./Campsite.css";

const Campsite = ({ campsite }) => {
  const {
    CampsiteName,
    CampsiteReservable,
    CampsiteType,
    ENTITYMEDIA,
    ATTRIBUTES,
  } = campsite;
  const [isExpanded, setIsExpanded] = useState(false);

  const thumbnail =
    ENTITYMEDIA?.find((media) => media.IsPrimary)?.URL || ENTITYMEDIA?.[0]?.URL;

  return (
    <div
      className={`campsite-tile ${isExpanded ? "expanded" : ""}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {thumbnail && (
        <img
          src={thumbnail}
          alt={`${CampsiteName} thumbnail`}
          className="campsite-thumbnail"
        />
      )}
      <h3>{CampsiteName}</h3>
      <p>Type: {CampsiteType}</p>
      <p>Reservable: {CampsiteReservable ? "Yes" : "No"}</p>

      {isExpanded && (
        <div className="campsite-details">
          <h4>Details</h4>
          {ATTRIBUTES && (
            <ul>
              {ATTRIBUTES.map((attribute, index) => (
                <li
                  key={index}
                >{`${attribute.AttributeName}: ${attribute.AttributeValue}`}</li>
              ))}
            </ul>
          )}
          {ENTITYMEDIA && (
            <div className="campsite-media">
              {ENTITYMEDIA.map((media, index) => (
                <img
                  key={index}
                  src={media.URL}
                  alt={media.Description || "Campsite Image"}
                  className="campsite-media-image"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Campsite;
