import PropTypes from "prop-types";
import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { LuToggleLeft, LuToggleRight, LuTrash2 } from "react-icons/lu";
import {
  batchDeleteReservations,
  fetchReservationsActive,
  fetchUserStatsActive,
  updateBatchMonitoringStatus,
} from "../../api/reservationManagement";
import ReservationFilters from "./ReservationFilters/ReservationFilters";
import ReservationGroup from "./ReservationGroup/ReservationGroup";
import { groupReservations } from "./utils/groupReservations";
import "./reservation-management.scss";

const DEFAULT_SORT_MODE = "campground";
const AUTO_COLLAPSE_GROUP_THRESHOLD = 4;

/**
 * Top-level statistics summary shown above the grouped reservation list.
 *
 * @param {{ stats?: Object | null }} props
 * @returns {JSX.Element}
 */
const StatsDisplay = ({ stats }) => {
  const defaultStats = {
    totalReservations: 0,
    activeMonitoring: 0,
    successfulNotifications: 0,
    totalAttempts: 0,
  };

  const displayStats = stats || defaultStats;

  return (
    <div className="user-stats">
      <h2>User Statistics</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total Reservations:</span>
          <span className="stat-value">{displayStats.totalReservations}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active Monitoring:</span>
          <span className="stat-value">{displayStats.activeMonitoring}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Availability Notifications Sent:</span>
          <span className="stat-value">
            {displayStats.successfulNotifications}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Availability Checks:</span>
          <span className="stat-value">{displayStats.totalAttempts}</span>
        </div>
      </div>
    </div>
  );
};

StatsDisplay.propTypes = {
  stats: PropTypes.shape({
    totalReservations: PropTypes.number,
    activeMonitoring: PropTypes.number,
    successfulNotifications: PropTypes.number,
    totalAttempts: PropTypes.number,
  }),
};

StatsDisplay.defaultProps = {
  stats: null,
};

/**
 * Toggle pill that flips monitoring on/off for *all* of the user's reservations.
 *
 * @param {{ active: boolean, onToggle: (next: boolean) => void }} props
 * @returns {JSX.Element}
 */
const MonitoringToggle = ({ active, onToggle }) => (
  <button
    className={`simple-toggle ${active ? "active" : "inactive"}`}
    onClick={() => onToggle(!active)}
    aria-pressed={active}
    title={active ? "Disable all monitoring" : "Enable all monitoring"}
  >
    {active ? (
      <>
        <LuToggleRight className="toggle-icon" />
        <span className="toggle-text">All Monitoring - Enabled</span>
      </>
    ) : (
      <>
        <LuToggleLeft className="toggle-icon" />
        <span className="toggle-text">All Monitoring - Disabled</span>
      </>
    )}
  </button>
);

MonitoringToggle.propTypes = {
  active: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

/**
 * "Delete all my reservations" button with a click-again-to-confirm pattern.
 *
 * @param {{ onDelete: () => void, disabled?: boolean }} props
 * @returns {JSX.Element}
 */
const DeleteAllButton = ({ onDelete, disabled }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      // Auto-reset the confirm state so a stray click later doesn't nuke data.
      window.setTimeout(() => setShowConfirm(false), 5000);
    } else {
      onDelete();
      setShowConfirm(false);
    }
  };

  return (
    <button
      className={`delete-all-button ${showConfirm ? "confirm" : ""}`}
      onClick={handleClick}
      disabled={disabled}
      title={
        showConfirm
          ? "Click again to confirm deletion"
          : "Delete all reservations"
      }
    >
      <LuTrash2 className="delete-icon" />
      <span className="delete-text">
        {showConfirm
          ? "Click Again to Confirm Delete All"
          : "Delete All Reservations"}
      </span>
    </button>
  );
};

DeleteAllButton.propTypes = {
  onDelete: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

DeleteAllButton.defaultProps = {
  disabled: false,
};

/**
 * Reservation management dashboard. Loads a user's active reservations and
 * organizes them into collapsible per-campground groups, each containing
 * date-range sub-sections and compact site rows. Supports search, sort, and
 * per-group bulk monitoring/delete to make managing many reservations
 * tractable.
 *
 * @returns {JSX.Element}
 */
const ReservationManagement = () => {
  const [email, setEmail] = useState("");
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allMonitoringActive, setAllMonitoringActive] = useState(false);

  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState(DEFAULT_SORT_MODE);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState(() => new Set());

  // Recompute groups whenever reservations / search / sort change. The
  // intermediate hierarchy is what the rendered list iterates over.
  const groups = useMemo(
    () => groupReservations(reservations, { query, sortMode }),
    [reservations, query, sortMode],
  );

  const totalGroupCount = useMemo(
    () => groupReservations(reservations, { sortMode }).length,
    [reservations, sortMode],
  );

  /**
   * Compute the initial expanded-group set for a freshly loaded reservation
   * list. When the user has only a few campgrounds we expand them all so
   * content is visible immediately; when there are many we start collapsed for
   * scannability. Pulled out of `useEffect` on purpose so per-row deletes /
   * monitoring toggles don't re-run this and stomp the user's manual
   * expand/collapse choices.
   *
   * @param {Object[]} list
   * @returns {Set<string>}
   */
  const computeInitialExpandedKeys = (list) => {
    const keys = groupReservations(list, { sortMode: DEFAULT_SORT_MODE }).map(
      (group) => group.key,
    );
    if (keys.length === 0) {
      return new Set();
    }
    if (keys.length <= AUTO_COLLAPSE_GROUP_THRESHOLD) {
      return new Set(keys);
    }
    return new Set();
  };

  const handleStatsUpdate = useCallback(async () => {
    if (!email) {
      return;
    }
    try {
      const response = await fetchUserStatsActive(email);
      if (response && response.stats) {
        setStats(response.stats);
      } else {
        setStats({
          totalReservations: 0,
          activeMonitoring: 0,
          successfulNotifications: 0,
          totalAttempts: 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
      setStats({
        totalReservations: 0,
        activeMonitoring: 0,
        successfulNotifications: 0,
        totalAttempts: 0,
      });
    }
  }, [email]);

  const handleSearch = async (emailAddress) => {
    try {
      setLoading(true);
      setError(null);

      const [reservationsData, statsData] = await Promise.all([
        fetchReservationsActive(emailAddress),
        fetchUserStatsActive(emailAddress),
      ]);

      const list = reservationsData?.reservations || [];
      setReservations(list);
      setStats(statsData?.stats || null);
      setAllMonitoringActive(
        list.length > 0 && list.every((res) => res.monitoring_active),
      );
      // Seed expansion only on a fresh search so subsequent per-row deletes /
      // toggles don't reset the user's manual expand/collapse choices.
      setExpandedGroupKeys(computeInitialExpandedKeys(list));
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
      setError(err.message);
      setReservations([]);
      setStats(null);
      setAllMonitoringActive(false);
      setExpandedGroupKeys(new Set());
    } finally {
      setLoading(false);
    }
  };

  const handleReservationDelete = useCallback(
    async (id) => {
      try {
        setReservations((prev) => prev.filter((res) => res.id !== id));
        await handleStatsUpdate();
      } catch (err) {
        console.error("Failed to update after deletion:", err);
      }
    },
    [handleStatsUpdate],
  );

  const handleBatchMonitoringUpdate = async (active) => {
    if (!email) {
      return;
    }
    try {
      await updateBatchMonitoringStatus(email, active);
      setReservations((prev) =>
        prev.map((res) => ({
          ...res,
          monitoring_active: active ? 1 : 0,
        })),
      );
      setAllMonitoringActive(active);
      await handleStatsUpdate();
    } catch (err) {
      console.error("Failed to update batch monitoring:", err);
      setError(err.message);
    }
  };

  const handleGroupMonitoringUpdate = useCallback(
    async (ids, active) => {
      if (!email || !Array.isArray(ids) || ids.length === 0) {
        return;
      }
      try {
        await updateBatchMonitoringStatus(email, active, ids);
        const idSet = new Set(ids);
        setReservations((prev) =>
          prev.map((res) =>
            idSet.has(res.id)
              ? { ...res, monitoring_active: active ? 1 : 0 }
              : res,
          ),
        );
        await handleStatsUpdate();
      } catch (err) {
        console.error("Failed to update group monitoring:", err);
        setError(err.message);
      }
    },
    [email, handleStatsUpdate],
  );

  const handleGroupDelete = useCallback(
    async (ids) => {
      if (!email || !Array.isArray(ids) || ids.length === 0) {
        return;
      }
      try {
        await batchDeleteReservations(email, ids);
        const idSet = new Set(ids);
        setReservations((prev) => prev.filter((res) => !idSet.has(res.id)));
        await handleStatsUpdate();
      } catch (err) {
        console.error("Failed to delete reservation group:", err);
        setError(err.message);
      }
    },
    [email, handleStatsUpdate],
  );

  /**
   * Delete *every* reservation owned by the current user. Sends all current
   * IDs to the batch endpoint at once.
   */
  const handleBatchDelete = async () => {
    if (!email || reservations.length === 0) {
      return;
    }
    try {
      const reservationIds = reservations.map((res) => res.id);
      await batchDeleteReservations(email, reservationIds);
      setReservations([]);
      setExpandedGroupKeys(new Set());
      await handleStatsUpdate();
    } catch (err) {
      console.error("Failed to batch delete reservations:", err);
      setError(err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      handleSearch(email);
    }
  };

  const handleToggleGroup = useCallback((key) => {
    setExpandedGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedGroupKeys(new Set(groups.map((group) => group.key)));
  }, [groups]);

  const handleCollapseAll = useCallback(() => {
    setExpandedGroupKeys(new Set());
  }, []);

  const reservationSchema = {
    "@context": "https://schema.org",
    "@type": "ReservationPackage",
    name: "Campsite Reservation Management",
    description: "Manage and track your campsite reservation alerts",
    provider: {
      "@type": "Organization",
      name: "KampScout",
    },
  };

  const hasReservations = reservations.length > 0;

  return (
    <>
      <Helmet>
        <title>Manage Reservation Alerts | Kamp Scout</title>
        <meta name="theme-color" content="#2b4c1c" />
        <script type="application/ld+json">
          {JSON.stringify(reservationSchema)}
        </script>
      </Helmet>
      <div className="user-management">
        <div className="hero-section">
          <div className="hero-content">
            <h1>Reservation Management</h1>
            <p className="description">
              Manage and track your campsite reservation alerts
            </p>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="unified-controls">
            <div className="controls-header">
              <h2>Search For Reservation Alerts</h2>
            </div>
            <div className="controls-body">
              <form onSubmit={handleSubmit} className="filter-options">
                <div className="form-group">
                  <div className="input-button-group">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter email address"
                    />
                    <button
                      type="submit"
                      className="search-button"
                      disabled={loading}
                    >
                      {loading ? "Searching..." : "Search"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {stats && <StatsDisplay stats={stats} />}

          {hasReservations && (
            <div className="batch-monitoring">
              <MonitoringToggle
                active={allMonitoringActive}
                onToggle={handleBatchMonitoringUpdate}
              />
              <DeleteAllButton
                onDelete={handleBatchDelete}
                disabled={loading}
              />
            </div>
          )}

          {hasReservations && (
            <div className="reservations-list">
              <h2>Reservations</h2>

              <ReservationFilters
                query={query}
                onQueryChange={setQuery}
                sortMode={sortMode}
                onSortModeChange={setSortMode}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
                visibleGroupCount={groups.length}
                totalGroupCount={totalGroupCount}
              />

              {groups.length > 0 ? (
                <div className="reservation-groups">
                  {groups.map((group) => (
                    <ReservationGroup
                      key={group.key}
                      campgroundName={group.campgroundName}
                      dateRanges={group.dateRanges}
                      totalCount={group.totalCount}
                      activeCount={group.activeCount}
                      isExpanded={expandedGroupKeys.has(group.key)}
                      onToggleExpanded={() => handleToggleGroup(group.key)}
                      onGroupMonitoringUpdate={handleGroupMonitoringUpdate}
                      onGroupDelete={handleGroupDelete}
                      onReservationDelete={handleReservationDelete}
                      onStatsUpdate={handleStatsUpdate}
                    />
                  ))}
                </div>
              ) : (
                <p className="reservations-empty">
                  No reservations match your filter.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReservationManagement;
