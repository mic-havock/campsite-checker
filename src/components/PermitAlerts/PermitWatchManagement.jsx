import PropTypes from "prop-types";
import { useCallback, useMemo, useState } from "react";
import { LuTrash2 } from "react-icons/lu";
import { format } from "date-fns";
import { disablePermitWatch, getPermitWatches } from "../../api/permits";
import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import "./permit-watch-management.scss";

/**
 * Display permit watches grouped by permit name.
 * @param {{ watches: Array, email: string, onUpdate: Function }} props
 * @returns {JSX.Element}
 */
const PermitWatchManagement = ({ watches, email, onUpdate }) => {
  const [disablingIds, setDisablingIds] = useState(new Set());

  const handleDisableWatch = useCallback(
    async (watchId) => {
      if (!email || disablingIds.has(watchId)) return;

      setDisablingIds((prev) => new Set(prev).add(watchId));
      try {
        await disablePermitWatch(watchId, email);
        await onUpdate();
      } catch (error) {
        console.error("Failed to disable permit watch:", error);
        alert("Failed to disable permit watch. Please try again.");
      } finally {
        setDisablingIds((prev) => {
          const next = new Set(prev);
          next.delete(watchId);
          return next;
        });
      }
    },
    [email, disablingIds, onUpdate]
  );

  const groupedWatches = useMemo(() => {
    const groups = {};
    watches.forEach((watch) => {
      const permitName = watch.permit_name || "Unknown Permit";
      if (!groups[permitName]) {
        groups[permitName] = [];
      }
      groups[permitName].push(watch);
    });
    return groups;
  }, [watches]);

  if (watches.length === 0) {
    return (
      <div className="permit-watch-management">
        <p className="no-watches">No permit watches found.</p>
      </div>
    );
  }

  return (
    <div className="permit-watch-management">
      {Object.entries(groupedWatches).map(([permitName, permitWatches]) => (
        <div key={permitName} className="permit-watch-group">
          <h3 className="permit-name">{permitName}</h3>
          <div className="watches-list">
            {permitWatches.map((watch) => (
              <div key={watch.id} className="watch-item">
                <div className="watch-info">
                  <div className="watch-divisions">
                    <strong>Zones:</strong>{" "}
                    {watch.division_ids && watch.division_ids.length > 0
                      ? watch.division_ids.join(", ")
                      : "N/A"}
                  </div>
                  <div className="watch-dates">
                    <strong>Dates:</strong> {watch.start_date} – {watch.end_date}
                  </div>
                  <div className="watch-meta">
                    <span className="watch-status">
                      Status:{" "}
                      {watch.monitoring_active ? (
                        <span className="status-active">Active</span>
                      ) : (
                        <span className="status-inactive">Inactive</span>
                      )}
                    </span>
                    {watch.created_at && (
                      <span className="watch-created">
                        Created:{" "}
                        {format(new Date(watch.created_at), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDisableWatch(watch.id)}
                  disabled={disablingIds.has(watch.id)}
                  className="disable-watch-btn"
                  title="Disable this permit watch"
                >
                  {disablingIds.has(watch.id) ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <LuTrash2 />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

PermitWatchManagement.propTypes = {
  watches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      permit_name: PropTypes.string,
      division_ids: PropTypes.arrayOf(PropTypes.string),
      start_date: PropTypes.string.isRequired,
      end_date: PropTypes.string.isRequired,
      monitoring_active: PropTypes.bool,
      created_at: PropTypes.string,
    })
  ).isRequired,
  email: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default PermitWatchManagement;
