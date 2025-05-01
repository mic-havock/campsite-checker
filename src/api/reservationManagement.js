import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Fetches reservation alerts for a given email address
export const fetchReservations = async (emailAddress) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/user/reservations?email=${emailAddress}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching reservations:", error);
    throw error.response?.data || error.message;
  }
};

// Fetches active reservations for a given email address
export const fetchReservationsActive = async (emailAddress) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/user/reservations/active?email=${emailAddress}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching reservations active:", error);
    throw error.response?.data || error.message;
  }
};

// Fetches user statistics for a given email address
export const fetchUserStats = async (emailAddress) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/user/stats?email=${emailAddress}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error.response?.data || error.message;
  }
};

// Fetches user statistics for active alerts for a given email address
export const fetchUserStatsActive = async (emailAddress) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/user/stats/active?email=${emailAddress}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user stats active:", error);
    throw error.response?.data || error.message;
  }
};

// Updates monitoring status for a reservation alert
export const updateMonitoringStatus = async (id, active) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/user/reservations/${id}/monitoring`,
      {
        active,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error updating monitoring status for reservation ${id}:`,
      error
    );
    throw error.response?.data || error.message;
  }
};

// Updates reservation alert dates
export const updateReservationDates = async (id, startDate, endDate) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/user/reservations/${id}/dates`,
      {
        startDate,
        endDate,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating dates for reservation ${id}:`, error);
    throw error.response?.data || error.message;
  }
};

// Deletes a reservation alert
export const deleteReservation = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/user/reservations/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting reservation ${id}:`, error);
    throw error.response?.data || error.message;
  }
};

// Soft deletes a reservation alert (user-initiated)
export const userDeleteReservation = async (id) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/user/reservations/${id}/user-delete`
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting reservation ${id}:`, error);
    throw error.response?.data || error.message;
  }
};

// Updates monitoring status for multiple reservation alerts
export const updateBatchMonitoringStatus = async (
  emailAddress,
  active,
  ids = null
) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/user/reservations/batch/monitoring`,
      {
        email: emailAddress,
        active,
        ...(ids && { ids }),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating batch monitoring status:", error);
    throw error.response?.data || error.message;
  }
};
