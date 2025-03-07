/**
 * Configuration constants for reservation statuses
 * @type {Object.<string, string>}
 */
export const RESERVATION_STATUS = {
  NOT_RESERVABLE: "Not Reservable",
  NOT_AVAILABLE: "Not Available",
  CLOSED: "Closed",
  NOT_AVAILABLE_CUTOFF: "Not Available Cutoff",
};

/**
 * Checks if a given status is non-reservable
 * @param {string | undefined | null} status - The reservation status to check
 * @returns {boolean} - True if the status is non-reservable, false otherwise
 */
export const isNonReservableStatus = (status) => {
  if (!status) return true;

  const nonReservableStatuses = new Set([
    RESERVATION_STATUS.NOT_RESERVABLE,
    RESERVATION_STATUS.NOT_AVAILABLE,
    RESERVATION_STATUS.CLOSED,
    RESERVATION_STATUS.NOT_AVAILABLE_CUTOFF,
  ]);

  return nonReservableStatuses.has(status);
};
