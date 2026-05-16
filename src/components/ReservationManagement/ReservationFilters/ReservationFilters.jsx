import PropTypes from "prop-types";
import { LuChevronDown, LuChevronRight, LuSearch, LuX } from "react-icons/lu";
import { SORT_OPTIONS } from "../utils/groupReservations";
import "./reservation-filters.scss";

/**
 * @typedef {Object} ReservationFiltersProps
 * @property {string} query
 * @property {(value: string) => void} onQueryChange
 * @property {string} sortMode
 * @property {(value: string) => void} onSortModeChange
 * @property {() => void} onExpandAll
 * @property {() => void} onCollapseAll
 * @property {number} visibleGroupCount
 * @property {number} totalGroupCount
 */

/**
 * Toolbar above the grouped reservation list. Provides quick search by
 * campground name, site number, or date string, a sort selector, and bulk
 * expand/collapse controls so users with many reservations can navigate
 * efficiently.
 *
 * @param {ReservationFiltersProps} props
 * @returns {JSX.Element}
 */
const ReservationFilters = ({
  query,
  onQueryChange,
  sortMode,
  onSortModeChange,
  onExpandAll,
  onCollapseAll,
  visibleGroupCount,
  totalGroupCount,
}) => {
  return (
    <div className="reservation-filters">
      <div className="reservation-filters__search">
        <LuSearch className="reservation-filters__search-icon" aria-hidden />
        <input
          type="search"
          className="reservation-filters__search-input"
          placeholder="Filter by campground, site number, or date…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Filter reservations"
        />
        {query ? (
          <button
            type="button"
            className="reservation-filters__clear"
            onClick={() => onQueryChange("")}
            title="Clear search"
            aria-label="Clear search"
          >
            <LuX />
          </button>
        ) : null}
      </div>

      <div className="reservation-filters__controls">
        <label className="reservation-filters__sort">
          <span className="reservation-filters__sort-label">Sort</span>
          <select
            className="reservation-filters__sort-select"
            value={sortMode}
            onChange={(e) => onSortModeChange(e.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="reservation-filters__expand-controls">
          <button
            type="button"
            className="reservation-filters__expand-button"
            onClick={onExpandAll}
            title="Expand all campground groups"
          >
            <LuChevronDown className="reservation-filters__expand-icon" />
            <span>Expand All</span>
          </button>
          <button
            type="button"
            className="reservation-filters__expand-button"
            onClick={onCollapseAll}
            title="Collapse all campground groups"
          >
            <LuChevronRight className="reservation-filters__expand-icon" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {totalGroupCount > 0 ? (
        <p className="reservation-filters__summary">
          {query
            ? `Showing ${visibleGroupCount} of ${totalGroupCount} ${
                totalGroupCount === 1 ? "campground" : "campgrounds"
              }`
            : `${totalGroupCount} ${
                totalGroupCount === 1 ? "campground" : "campgrounds"
              }`}
        </p>
      ) : null}
    </div>
  );
};

ReservationFilters.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  sortMode: PropTypes.string.isRequired,
  onSortModeChange: PropTypes.func.isRequired,
  onExpandAll: PropTypes.func.isRequired,
  onCollapseAll: PropTypes.func.isRequired,
  visibleGroupCount: PropTypes.number.isRequired,
  totalGroupCount: PropTypes.number.isRequired,
};

export default ReservationFilters;
