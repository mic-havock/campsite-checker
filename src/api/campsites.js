import axios from "axios";

const BASE_URL = "http://localhost:3000/api/campsites"; // Replace with your backend's URL if deployed

// Fetch availability for a campground
export const fetchCampgroundAvailability = async (campgroundId, startDate) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/${campgroundId}/availability`,
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
    const response = await axios.get(`${BASE_URL}/availability/${campsiteId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching campsite availability:", error);
    throw error;
  }
};
