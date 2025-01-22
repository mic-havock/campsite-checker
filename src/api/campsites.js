import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Fetch availability for a campground
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

// Fetch availability for a specific campsite
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

/**
 * Fetch all campsites under a specific facility
 * @param {string} facilityId - The ID of the facility
 * @returns {Promise} - Resolves to the list of campsites under the facility
 */
export const fetchCampsitesByFacility = async (facilityId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/facilities/${facilityId}/campsites`
    );
    console.log(
      "Response from fetchCampsitesByFacility is api:",
      JSON.stringify(response)
    ); //
    return response.data || []; // Return campsites (RECDATA)
  } catch (error) {
    console.error(
      "Error fetching campsites by facility:",
      error.response?.data || error.message
    );
    throw error;
  }
};
