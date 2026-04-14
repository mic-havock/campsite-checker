import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;
export const fetchCampgroundAvailability = async (campgroundId, startDate) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/campsites/${campgroundId}/availability`,
      {
        params: { startDate },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching campground availability:", error);
    throw error;
  }
};
export const fetchCampsiteAvailability = async (campsiteId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/campsites/availability/${campsiteId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching campsite availability:", error);
    throw error;
  }
};
export const fetchCampsitesByFacility = async (facilityId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/facilities/${facilityId}/campsites`
    );
    return response.data || [];
  } catch (error) {
    console.error(
      "Error fetching campsites by facility:",
      error.response?.data || error.message
    );
    throw error;
  }
};
const campsiteDetailsCache = new Map();

/**
 * Fetches campsite details with memoization to prevent redundant API calls.
 * Caches the promise to handle concurrent requests for the same campsiteId.
 */
export const fetchCampsiteDetails = async (campsiteId) => {
  if (campsiteDetailsCache.has(campsiteId)) {
    return campsiteDetailsCache.get(campsiteId);
  }

  const fetchPromise = (async () => {
    try {
      const response = await axios.get(`${BASE_URL}/campsites/${campsiteId}`);
      return response.data;
    } catch (error) {
      // Remove from cache on failure to allow subsequent retry attempts
      campsiteDetailsCache.delete(campsiteId);
      console.error(
        "Error fetching campsite details:",
        error.response?.data || error.message
      );
      throw error;
    }
  })();

  campsiteDetailsCache.set(campsiteId, fetchPromise);
  return fetchPromise;
};
