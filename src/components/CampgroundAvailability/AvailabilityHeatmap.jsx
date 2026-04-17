import PropTypes from "prop-types";
import { useEffect, useState, useMemo } from "react";
import { fetchCampgroundAvailability } from "../../api/campsites";
import "./availability-heatmap.scss";
import { format, addDays, startOfDay } from "date-fns";

const AvailabilityHeatmap = ({ facilityId, campsites }) => {
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const startDate = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => addDays(startDate, i)),
    [startDate]
  );

  useEffect(() => {
    const loadAvailability = async () => {
      if (!facilityId) return;
      setLoading(true);
      try {
        const data = await fetchCampgroundAvailability(facilityId, format(startDate, "yyyy-MM-dd'T'00:00:00'Z'"));
        // API response structure is usually { campsiteId: { date: status } }
        setAvailability(data.campsites || {});
      } catch (error) {
        console.error("Failed to load campground availability", error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [facilityId, startDate]);

  const handleCellClick = (campsiteId, date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedCell({ campsiteId, date: dateStr });
  };

  if (loading && Object.keys(availability).length === 0) {
    return <div className="heatmap-loading">Loading 14-day availability...</div>;
  }

  return (
    <div className="availability-heatmap-container">
      <div className="heatmap-header">
        <div className="campsite-col-header">Campsite</div>
        <div className="days-header">
          {days.map(day => (
            <div key={day.toISOString()} className="day-label">
              <span className="day-name">{format(day, "EEE")}</span>
              <span className="day-num">{format(day, "d")}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-body">
        {campsites.slice(0, 10).map(campsite => (
          <div key={campsite.CampsiteID} className="heatmap-row">
            <div className="campsite-name-cell">{campsite.CampsiteName}</div>
            <div className="days-row">
              {days.map(day => {
                const dateStr = format(day, "yyyy-MM-dd'T'00:00:00'Z'");
                const status = availability[campsite.CampsiteID]?.[dateStr];
                const isAvailable = status === "Available" || status === "Open";
                const isSelected = selectedCell?.campsiteId === campsite.CampsiteID &&
                                   selectedCell?.date === format(day, "yyyy-MM-dd");

                return (
                  <div
                    key={day.toISOString()}
                    className={`heatmap-cell ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCellClick(campsite.CampsiteID, day)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${campsite.CampsiteName} on ${format(day, "MMM d")}: ${isAvailable ? 'Available' : 'Unavailable'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleCellClick(campsite.CampsiteID, day);
                      }
                    }}
                  >
                    {isSelected && (
                      <div className="cell-actions" onClick={e => e.stopPropagation()}>
                        {isAvailable ? (
                          <button className="action-btn reserve">Reserve</button>
                        ) : (
                          <button className="action-btn monitor">Monitor</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {campsites.length > 10 && (
          <div className="heatmap-footer">
            Showing first 10 sites. Use list below for all sites.
          </div>
        )}
      </div>
    </div>
  );
};

AvailabilityHeatmap.propTypes = {
  facilityId: PropTypes.string.isRequired,
  campsites: PropTypes.array.isRequired,
};

export default AvailabilityHeatmap;
