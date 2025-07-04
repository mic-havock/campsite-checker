import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;
export const getFacilities = async (params) => {
  try {
    const response = await axios.get(`${BASE_URL}/facilities`, {
      params: {
        query: params.query || "",
        state: params.state || "",
        limit: params.limit || "",
        latitude: params.latitude || "",
        longitude: params.longitude || "",
        radius: params.radius || "",
        sort: params.sort || "ID",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching facilities:", error);
    throw error;
  }
};
