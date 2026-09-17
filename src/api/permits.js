import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Fetch the curated catalog of available wilderness permits.
 * Backend returns a bare array of permits.
 * @returns {Promise<Array>} Array of permit objects
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
 * Backend returns a bare array of division objects.
 * @param {string} permitId - The Recreation.gov permit ID
 * @returns {Promise<Array>} Array of division objects with {id, name, ...}
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
 * @param {Object} data - Watch data with snake_case fields:
 *   - name: string
 *   - email_address: string
 *   - permit_id: string
 *   - permit_name: string
 *   - division_ids: string[]
 *   - start_date: string (YYYY-MM-DD)
 *   - end_date: string (YYYY-MM-DD)
 *   - group_size: number (optional)
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
 * Backend returns watches with snake_case fields.
 * @param {string} email - User email address
 * @returns {Promise<Array>} Array of watch objects with snake_case fields
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
 * Backend sets monitoring_active = 0 and returns HTML.
 * @param {string} id - Watch ID
 * @param {string} email - User email address (will be URL-encoded)
 * @returns {Promise<void>}
 */
export const disablePermitWatch = async (id, email) => {
  try {
    // URL-encode email to handle @ and other special characters
    const encodedEmail = encodeURIComponent(email);
    // Backend returns HTML, not JSON. Accept any 2xx response as success.
    await axios.get(`${BASE_URL}/permits/watches/disable/${id}/${encodedEmail}`, {
      validateStatus: (status) => status >= 200 && status < 300,
    });
  } catch (error) {
    console.error(`Error disabling permit watch ${id}:`, error);
    // Extract meaningful error message
    const errorMessage = error.response?.data || error.message || "Failed to disable permit watch";
    throw new Error(errorMessage);
  }
};
