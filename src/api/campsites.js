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

// Get campsites for a facility
export const fetchCampsitesByFacility = async (facilityId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/facilities/${facilityId}/campsites`
    );
    return response.data || []; // Return campsites (RECDATA)
  } catch (error) {
    console.error(
      "Error fetching campsites by facility:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Fetch details for a specific campsite
export const fetchCampsiteDetails = async (campsiteId) => {
  try {
    const response = await axios.get(`${BASE_URL}/campsites/${campsiteId}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching campsite details:",
      error.response?.data || error.message
    );
    throw error;
  }
};
