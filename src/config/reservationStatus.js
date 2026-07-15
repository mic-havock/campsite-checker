export const RESERVATION_STATUS = {
  AVAILABLE: "Available",
  OPEN: "Open",
  RESERVED: "Reserved",
  CHECKOUT_ONLY: "Checkout",
  NOT_RESERVABLE: "Not Reservable",
  NOT_AVAILABLE: "Not Available",
  CLOSED: "Closed",
  NOT_AVAILABLE_CUTOFF: "Not Available Cutoff",
  NOT_YET_RESERVABLE: "NYR",
};

export const isNonReservableStatus = (status) => {
  if (!status) return true;

  const nonReservableStatuses = new Set([
    RESERVATION_STATUS.NOT_RESERVABLE,
    RESERVATION_STATUS.NOT_AVAILABLE,
    RESERVATION_STATUS.CLOSED,
    RESERVATION_STATUS.NOT_AVAILABLE_CUTOFF,
    RESERVATION_STATUS.NOT_YET_RESERVABLE,
  ]);

  return nonReservableStatuses.has(status);
};

/** Check-in is allowed only on Open/Available dates within the reservation window. */
export const isAvailableForCheckIn = (status) => {
  return (
    status === RESERVATION_STATUS.AVAILABLE ||
    status === RESERVATION_STATUS.OPEN
  );
};

/** Beyond the reservation window: valid as a stay/checkout night, not as arrival. */
export const isCheckoutOnlyStatus = (status) => {
  return status === RESERVATION_STATUS.CHECKOUT_ONLY;
};

/** Reserved, NYR, and checkout-only dates can be clicked to create availability alerts. */
export const isAlertableStatus = (status) => {
  return (
    status === RESERVATION_STATUS.RESERVED ||
    status === RESERVATION_STATUS.NOT_YET_RESERVABLE ||
    status === RESERVATION_STATUS.CHECKOUT_ONLY
  );
};

/**
 * Maps a recreation.gov status string to a UI category used by calendar components.
 * @returns {"available" | "reserved" | "nyr" | "checkout" | "not-reservable"}
 */
export const getAvailabilityCategory = (status) => {
  if (isAvailableForCheckIn(status)) {
    return "available";
  }

  if (status === RESERVATION_STATUS.RESERVED) {
    return "reserved";
  }

  if (status === RESERVATION_STATUS.NOT_YET_RESERVABLE) {
    return "nyr";
  }

  if (isCheckoutOnlyStatus(status)) {
    return "checkout";
  }

  if (isNonReservableStatus(status)) {
    return "not-reservable";
  }

  return "reserved";
};
