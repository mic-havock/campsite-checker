export const RESERVATION_STATUS = {
  NOT_RESERVABLE: "Not Reservable",
  NOT_AVAILABLE: "Not Available",
  CLOSED: "Closed",
  NOT_AVAILABLE_CUTOFF: "Not Available Cutoff",
};

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
