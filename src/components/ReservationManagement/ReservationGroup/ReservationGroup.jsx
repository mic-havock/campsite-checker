import { format, parseISO } from "date-fns";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import {
  LuChevronDown,
  LuChevronRight,
  LuToggleLeft,
  LuToggleRight,
  LuTrash2,
  LuTreePine,
} from "react-icons/lu";
import ReservationRow from "../ReservationRow/ReservationRow";
import "./reservation-group.scss";

const INITIAL_VISIBLE_PER_DATE = 30;
const SHOW_MORE_INCREMENT = 60;

/**
 * Format an ISO date string for display, swallowing parse errors so a single
 * malformed value doesn't break the whole list.
 *
 * @param {string} dateString
 * @returns {string}
 */
const formatDate = (dateString) => {
  if (!dateString) {
    return "";
  }
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * @typedef {Object} DateRangeGroup
 * @property {string} key
 * @property {string} startDate
 * @property {string} endDate
 * @property {Object[]} reservations
 */

/**
 * @typedef {Object} ReservationGroupProps
 * @property {string} campgroundName
 * @property {DateRangeGroup[]} dateRanges
 * @property {number} totalCount
 * @property {number} activeCount
 * @property {boolean} isExpanded
 * @property {() => void} onToggleExpanded
 * @property {(ids: number[], active: boolean) => void | Promise<void>} onGroupMonitoringUpdate
 * @property {(ids: number[]) => void | Promise<void>} onGroupDelete
 * @property {(id: number) => void | Promise<void>} onReservationDelete
 * @property {() => void | Promise<void>} onStatsUpdate
 */

/**
 * Collapsible section grouping all reservations for a single campground,
 * sub-grouped by reservation date range. Provides per-campground bulk
 * monitoring toggle and bulk delete to make managing many sites manageable.
 *
 * @param {ReservationGroupProps} props
 * @returns {JSX.Element}
 */
const ReservationGroup = ({
  campgroundName,
  dateRanges,
  totalCount,
  activeCount,
  isExpanded,
  onToggleExpanded,
  onGroupMonitoringUpdate,
  onGroupDelete,
  onReservationDelete,
  onStatsUpdate,
}) => {
  // Track per-date-range pagination so very large groups (e.g. 500+ sites at
  // the same campground/date) don't render thousands of DOM rows up front.
  const [visibleCounts, setVisibleCounts] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allMonitoringActive = useMemo(
    () => totalCount > 0 && activeCount === totalCount,
    [activeCount, totalCount],
  );

  const allReservationIds = useMemo(
    () =>
      dateRanges.flatMap((range) =>
        range.reservations.map((reservation) => reservation.id),
      ),
    [dateRanges],
  );

  /**
   * Resolve the visible row count for a date range, defaulting to the initial
   * page size when the user hasn't explicitly expanded this sub-group.
   */
  const getVisibleCount = (key) =>
    visibleCounts[key] ?? INITIAL_VISIBLE_PER_DATE;

  const handleShowMore = (key, total) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [key]: Math.min(
        (prev[key] ?? INITIAL_VISIBLE_PER_DATE) + SHOW_MORE_INCREMENT,
        total,
      ),
    }));
  };

  const handleShowAll = (key, total) => {
    setVisibleCounts((prev) => ({ ...prev, [key]: total }));
  };

  const handleCollapseRange = (key) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [key]: INITIAL_VISIBLE_PER_DATE,
    }));
  };

  const handleBulkMonitoringToggle = async (event) => {
    event.stopPropagation();
    if (allReservationIds.length === 0) {
      return;
    }
    await onGroupMonitoringUpdate(allReservationIds, !allMonitoringActive);
  };

  const handleBulkDeleteClick = async (event) => {
    event.stopPropagation();
    if (allReservationIds.length === 0) {
      return;
    }
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      window.setTimeout(() => setShowDeleteConfirm(false), 5000);
      return;
    }
    setShowDeleteConfirm(false);
    await onGroupDelete(allReservationIds);
  };

  return (
    <section
      className={`reservation-group ${isExpanded ? "is-expanded" : "is-collapsed"}`}
    >
      <header className="reservation-group__header">
        <button
          type="button"
          className="reservation-group__toggle"
          onClick={onToggleExpanded}
          aria-expanded={isExpanded}
          aria-controls={`reservation-group-${campgroundName}`}
        >
          {isExpanded ? (
            <LuChevronDown className="reservation-group__chevron" />
          ) : (
            <LuChevronRight className="reservation-group__chevron" />
          )}
          <LuTreePine className="reservation-group__icon" aria-hidden />
          <span className="reservation-group__name">{campgroundName}</span>
          <span className="reservation-group__count">
            {`${totalCount} ${totalCount === 1 ? "site" : "sites"}`}
          </span>
          <span
            className={`reservation-group__monitor-summary ${
              activeCount > 0 ? "is-active" : "is-inactive"
            }`}
            title={`${activeCount} of ${totalCount} monitoring`}
          >
            {`${activeCount}/${totalCount} monitoring`}
          </span>
        </button>

        <div className="reservation-group__bulk-actions">
          <button
            type="button"
            className={`reservation-group__bulk-toggle ${
              allMonitoringActive ? "is-on" : "is-off"
            }`}
            onClick={handleBulkMonitoringToggle}
            aria-pressed={allMonitoringActive}
            title={
              allMonitoringActive
                ? `Disable monitoring for all ${totalCount} sites`
                : `Enable monitoring for all ${totalCount} sites`
            }
          >
            {allMonitoringActive ? (
              <LuToggleRight className="reservation-group__bulk-icon" />
            ) : (
              <LuToggleLeft className="reservation-group__bulk-icon" />
            )}
            <span>{allMonitoringActive ? "All On" : "All Off"}</span>
          </button>

          <button
            type="button"
            className={`reservation-group__bulk-delete ${
              showDeleteConfirm ? "is-confirming" : ""
            }`}
            onClick={handleBulkDeleteClick}
            title={
              showDeleteConfirm
                ? "Click again to confirm"
                : `Delete all ${totalCount} reservations in this campground`
            }
          >
            <LuTrash2 className="reservation-group__bulk-icon" />
            <span>{showDeleteConfirm ? "Confirm" : "Delete Group"}</span>
          </button>
        </div>
      </header>

      {isExpanded ? (
        <div
          className="reservation-group__body"
          id={`reservation-group-${campgroundName}`}
        >
          {dateRanges.map((range) => {
            const visibleCount = getVisibleCount(range.key);
            const visible = range.reservations.slice(0, visibleCount);
            const hasMore = visibleCount < range.reservations.length;
            const isExpandedRange = visibleCount > INITIAL_VISIBLE_PER_DATE;
            return (
              <div className="reservation-group__date-range" key={range.key}>
                <div className="reservation-group__date-header">
                  <span className="reservation-group__date-label">
                    {`${formatDate(range.startDate)} – ${formatDate(range.endDate)}`}
                  </span>
                  <span className="reservation-group__date-count">
                    {`${range.reservations.length} ${
                      range.reservations.length === 1 ? "site" : "sites"
                    }`}
                  </span>
                </div>

                <div className="reservation-group__row-grid">
                  {visible.map((reservation) => (
                    <ReservationRow
                      key={reservation.id}
                      reservation={reservation}
                      onDelete={onReservationDelete}
                      onStatsUpdate={onStatsUpdate}
                    />
                  ))}
                </div>

                {(hasMore || isExpandedRange) && (
                  <div className="reservation-group__pagination">
                    {hasMore ? (
                      <>
                        <button
                          type="button"
                          className="reservation-group__pagination-button"
                          onClick={() =>
                            handleShowMore(range.key, range.reservations.length)
                          }
                        >
                          {`Show ${Math.min(
                            SHOW_MORE_INCREMENT,
                            range.reservations.length - visibleCount,
                          )} more`}
                        </button>
                        <button
                          type="button"
                          className="reservation-group__pagination-button is-secondary"
                          onClick={() =>
                            handleShowAll(range.key, range.reservations.length)
                          }
                        >
                          {`Show all ${range.reservations.length}`}
                        </button>
                      </>
                    ) : null}
                    {isExpandedRange ? (
                      <button
                        type="button"
                        className="reservation-group__pagination-button is-secondary"
                        onClick={() => handleCollapseRange(range.key)}
                      >
                        Show less
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

ReservationGroup.propTypes = {
  campgroundName: PropTypes.string.isRequired,
  dateRanges: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      reservations: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
        }),
      ).isRequired,
    }),
  ).isRequired,
  totalCount: PropTypes.number.isRequired,
  activeCount: PropTypes.number.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpanded: PropTypes.func.isRequired,
  onGroupMonitoringUpdate: PropTypes.func.isRequired,
  onGroupDelete: PropTypes.func.isRequired,
  onReservationDelete: PropTypes.func.isRequired,
  onStatsUpdate: PropTypes.func.isRequired,
};

export default ReservationGroup;
