/**
 * Utilities for filtering, sorting, and grouping a flat list of reservations
 * into a campground -> date-range -> reservations hierarchy that powers the
 * grouped Reservation Management view.
 */

/** @typedef {"campground" | "date" | "monitoring"} SortMode */

/** @typedef {Object} Reservation
 *  @property {number} id
 *  @property {string} [campsite_name]
 *  @property {string} [campsite_number]
 *  @property {string|number} campsite_id
 *  @property {string} [facility_name]
 *  @property {string} reservation_start_date
 *  @property {string} reservation_end_date
 *  @property {number|boolean} monitoring_active
 *  @property {number} attempts_made
 */

/** @typedef {Object} DateRangeGroup
 *  @property {string} key
 *  @property {string} startDate
 *  @property {string} endDate
 *  @property {Reservation[]} reservations
 */

/** @typedef {Object} CampgroundGroup
 *  @property {string} key
 *  @property {string} campgroundName
 *  @property {Reservation[]} reservations
 *  @property {DateRangeGroup[]} dateRanges
 *  @property {number} totalCount
 *  @property {number} activeCount
 *  @property {string} earliestStartDate
 */

const UNKNOWN_CAMPGROUND_LABEL = "Unknown Campground";

/**
 * Resolve the best-available campground/facility label for a reservation.
 * Falls back through facility_name -> campsite_name -> a fixed unknown label
 * so that grouping never produces an empty key.
 *
 * @param {Reservation} reservation
 * @returns {string}
 */
export const getCampgroundName = (reservation) => {
  const facility =
    typeof reservation.facility_name === "string"
      ? reservation.facility_name.trim()
      : "";
  if (facility) {
    return facility;
  }
  const campsite =
    typeof reservation.campsite_name === "string"
      ? reservation.campsite_name.trim()
      : "";
  if (campsite) {
    return campsite;
  }
  return UNKNOWN_CAMPGROUND_LABEL;
};

/**
 * Build a stable date-range key from start/end ISO date strings.
 *
 * @param {string} startDate
 * @param {string} endDate
 * @returns {string}
 */
export const getDateRangeKey = (startDate, endDate) =>
  [startDate || "", endDate || ""].join("__");

/**
 * Compare a search query against searchable reservation fields.
 *
 * @param {Reservation} reservation
 * @param {string} query
 * @returns {boolean}
 */
const matchesQuery = (reservation, query) => {
  if (!query) {
    return true;
  }
  const haystack = [
    getCampgroundName(reservation),
    reservation.campsite_name || "",
    reservation.campsite_number || "",
    reservation.reservation_start_date || "",
    reservation.reservation_end_date || "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
};

/**
 * Numeric-aware comparator for site numbers like "006", "10A", "Loop B-12".
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
const compareSiteNumbers = (a, b) => {
  const left = (a || "").toString();
  const right = (b || "").toString();
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

/**
 * Build the campground -> date-range -> reservations grouping with the
 * provided search query and sort mode applied.
 *
 * @param {Reservation[]} reservations
 * @param {{ query?: string, sortMode?: SortMode }} [options]
 * @returns {CampgroundGroup[]}
 */
export const groupReservations = (reservations, options = {}) => {
  const { query = "", sortMode = "campground" } = options;

  const filtered = (reservations || []).filter((reservation) =>
    matchesQuery(reservation, query),
  );

  /** @type {Map<string, CampgroundGroup>} */
  const campgroundMap = new Map();

  filtered.forEach((reservation) => {
    const campgroundName = getCampgroundName(reservation);
    if (!campgroundMap.has(campgroundName)) {
      campgroundMap.set(campgroundName, {
        key: campgroundName,
        campgroundName,
        reservations: [],
        dateRanges: [],
        totalCount: 0,
        activeCount: 0,
        earliestStartDate: "",
      });
    }
    const group = campgroundMap.get(campgroundName);
    if (!group) {
      return;
    }
    group.reservations.push(reservation);
    group.totalCount += 1;
    if (reservation.monitoring_active) {
      group.activeCount += 1;
    }
    if (
      !group.earliestStartDate ||
      (reservation.reservation_start_date &&
        reservation.reservation_start_date < group.earliestStartDate)
    ) {
      group.earliestStartDate = reservation.reservation_start_date || "";
    }
  });

  // Build date-range subgroups within each campground.
  campgroundMap.forEach((group) => {
    /** @type {Map<string, DateRangeGroup>} */
    const dateMap = new Map();
    group.reservations.forEach((reservation) => {
      const key = getDateRangeKey(
        reservation.reservation_start_date,
        reservation.reservation_end_date,
      );
      if (!dateMap.has(key)) {
        dateMap.set(key, {
          key,
          startDate: reservation.reservation_start_date,
          endDate: reservation.reservation_end_date,
          reservations: [],
        });
      }
      const sub = dateMap.get(key);
      if (sub) {
        sub.reservations.push(reservation);
      }
    });

    // Sort sites within each date sub-group by numeric site number.
    dateMap.forEach((sub) => {
      sub.reservations.sort((a, b) =>
        compareSiteNumbers(a.campsite_number, b.campsite_number),
      );
    });

    // Sort the date sub-groups by earliest start date ascending.
    group.dateRanges = Array.from(dateMap.values()).sort((a, b) =>
      (a.startDate || "").localeCompare(b.startDate || ""),
    );
  });

  const groups = Array.from(campgroundMap.values());

  // Apply campground-level sort.
  if (sortMode === "date") {
    groups.sort((a, b) =>
      (a.earliestStartDate || "").localeCompare(b.earliestStartDate || ""),
    );
  } else if (sortMode === "monitoring") {
    groups.sort((a, b) => {
      const ratioA = a.totalCount > 0 ? a.activeCount / a.totalCount : 0;
      const ratioB = b.totalCount > 0 ? b.activeCount / b.totalCount : 0;
      if (ratioA !== ratioB) {
        return ratioB - ratioA;
      }
      return a.campgroundName.localeCompare(b.campgroundName, undefined, {
        sensitivity: "base",
      });
    });
  } else {
    groups.sort((a, b) =>
      a.campgroundName.localeCompare(b.campgroundName, undefined, {
        sensitivity: "base",
      }),
    );
  }

  return groups;
};

export const SORT_OPTIONS = [
  { value: "campground", label: "Campground (A-Z)" },
  { value: "date", label: "Earliest Date" },
  { value: "monitoring", label: "Most Active Monitoring" },
];
