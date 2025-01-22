import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

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
