/**
 * Generates an array of YYYY-MM-DD strings for all days in the month of the given ISO date.
 * The dates are generated in UTC.
 *
 * @param {string} isoString - The ISO date string to get the month from.
 * @returns {string[]} An array of date strings in YYYY-MM-DD format.
 */
export const getUtcDateStringsForMonth = (isoString) => {
  const date = new Date(isoString);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const dates = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, month, day));
    dates.push(d.toISOString().substring(0, 10));
  }

  return dates;
};
