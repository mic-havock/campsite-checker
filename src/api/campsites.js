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
