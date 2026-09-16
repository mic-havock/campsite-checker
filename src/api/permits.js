import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Fetch the curated catalog of available wilderness permits.
 * @returns {Promise<Object>} Response containing permits array
 */
export const getPermitCatalog = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/permits/catalog`);
    return response.data;
  } catch (error) {
    console.error("Error fetching permit catalog:", error);
    throw error.response?.data || error.message;
  }
};

/**
 * Fetch divisions (camps/zones) for a specific permit.
 * @param {string} permitId - The Recreation.gov permit ID
 * @returns {Promise<Object>} Response containing divisions array
 */
export const getPermitDivisions = async (permitId) => {
  try {
    const response = await axios.get(`${BASE_URL}/permits/${permitId}/divisions`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching divisions for permit ${permitId}:`, error);
    throw error.response?.data || error.message;
  }
};

/**
 * Create a new permit watch alert.
 * @param {Object} data - Watch data including permitId, divisionIds, startDate, endDate, email, name
 * @returns {Promise<Object>} Response from the API
 */
export const createPermitWatch = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/permits/watches`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating permit watch:", error);
    throw error.response?.data || error.message;
  }
};

/**
 * Fetch all permit watches for a specific email.
 * @param {string} email - User email address
 * @returns {Promise<Object>} Response containing watches array
 */
export const getPermitWatches = async (email) => {
  try {
    const response = await axios.get(`${BASE_URL}/permits/watches`, {
      params: { email },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching permit watches:", error);
    throw error.response?.data || error.message;
  }
};

/**
 * Disable a specific permit watch.
 * @param {string} id - Watch ID
 * @param {string} email - User email address
 * @returns {Promise<Object>} Response from the API
 */
export const disablePermitWatch = async (id, email) => {
  try {
    const response = await axios.get(`${BASE_URL}/permits/watches/disable/${id}/${email}`);
    return response.data;
  } catch (error) {
    console.error(`Error disabling permit watch ${id}:`, error);
    throw error.response?.data || error.message;
  }
};
