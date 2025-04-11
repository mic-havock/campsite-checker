/**
 * API service for user management functionality
 * Handles all API calls related to user reservations and monitoring
 */

import axios from "axios";

// Base URL configured from the environment
const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Fetches reservations for a given email address
 * @param {string} emailAddress - Email address to search for
 * @returns {Promise<Object>} - Response containing reservations data
 * @throws {Error} - If the API call fails
 */
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

/**
 * Fetches reservations for a given email address
 * @param {string} emailAddress - Email address to search for
 * @returns {Promise<Object>} - Response containing reservations data
 * @throws {Error} - If the API call fails
 */
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

/**
 * Fetches user statistics for a given email address
 * @param {string} emailAddress - Email address to get stats for
 * @returns {Promise<Object>} - Response containing user statistics
 * @throws {Error} - If the API call fails
 */
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

/**
 * Fetches user statistics for a given email address
 * @param {string} emailAddress - Email address to get stats for
 * @returns {Promise<Object>} - Response containing user statistics
 * @throws {Error} - If the API call fails
 */
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

/**
 * Updates monitoring status for a reservation
 * @param {number} id - Reservation ID
 * @param {boolean} active - New monitoring status
 * @returns {Promise<Object>} - Response containing updated reservation data
 * @throws {Error} - If the API call fails
 */
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

/**
 * Updates reservation dates
 * @param {number} id - Reservation ID
 * @param {string} startDate - New start date
 * @param {string} endDate - New end date
 * @returns {Promise<Object>} - Response containing updated reservation data
 * @throws {Error} - If the API call fails
 */
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

/**
 * Deletes a reservation
 * @param {number} id - Reservation ID to delete
 * @returns {Promise<Object>} - Response containing success message
 * @throws {Error} - If the API call fails
 */
export const deleteReservation = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/user/reservations/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting reservation ${id}:`, error);
    throw error.response?.data || error.message;
  }
};

/**
 * Soft deletes a reservation
 * @param {number} id - Reservation ID to delete
 * @returns {Promise<Object>} - Response containing success message
 * @throws {Error} - If the API call fails
 */
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

/**
 * Updates monitoring status for multiple reservations
 * @param {string} emailAddress - Email address of the user
 * @param {boolean} active - New monitoring status
 * @param {number[]} [ids] - Optional array of specific reservation IDs to update
 * @returns {Promise<Object>} - Response containing updated reservations data
 * @throws {Error} - If the API call fails
 */
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
