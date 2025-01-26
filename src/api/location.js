import axios from "axios";

/**
 * Fetches the city and state based on latitude and longitude using the HERE API.
 * @param {number} latitude - The latitude of the location.
 * @param {number} longitude - The longitude of the location.
 * @returns {Promise<{city: string, state: string}>} - An object containing the city and state.
 */
export const fetchCityAndState = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://revgeocode.search.hereapi.com/v1/revgeocode`,
      {
        params: {
          at: `${latitude},${longitude}`,
          apiKey: "YOUR_HERE_API_KEY", // Replace with your HERE API key
        },
      }
    );

    const data = response.data.items[0];
    const state = data.address.state || "Unknown State";
    const city = data.address.city || "Unknown City";

    return { city, state };
  } catch (error) {
    console.error("Geocoding error:", error);
    return { city: "Unknown City", state: "Unknown State" };
  }
};
