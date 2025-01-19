import axios from "axios";

const BASE_URL = "http://localhost:3000/api"; // Replace with your backend's URL if deployed

// Fetch availability for a campground
export const getFacilities = async (name, state) => {
  try {
    const response = await axios.get(`${BASE_URL}/facilities`, {
      params: {
        query: name,
        state: state,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching facilities:", error);
    throw error;
  }
};
