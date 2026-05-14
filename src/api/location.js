import axios from "axios";

const BASE_URL = import.meta.env?.VITE_BASE_URL || "http://localhost:3000/api";

const locationCache = new Map();

export const getFacilityAddress = async (facilityId) => {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  // ⚡ Bolt: Cache the promise to prevent concurrent identical requests
  if (!locationCache.has(facilityId)) {
    const fetchPromise = axios
      .get(`${BASE_URL}/facilities/${facilityId}/addresses`)
      .then((response) =>
        response.data.RECDATA.map((item) => ({
          city: item.City,
          state: item.AddressStateCode,
        }))
      )
      .catch((error) => {
        locationCache.delete(facilityId); // clear cache on failure
        console.error("Error fetching facility address:", error.message || error);
        throw error;
      });

    locationCache.set(facilityId, fetchPromise);
  }

  return locationCache.get(facilityId);
};

export const fetchCityAndState = async (facilityId) => {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  try {
    const addressData = await getFacilityAddress(facilityId);
    if (addressData && addressData.length > 0) {
      const { city, state } = addressData[0];
      return {
        city: city || "N/A",
        state: state || "N/A",
      };
    }

    return { city: "N/A", state: "N/A" };
  } catch (error) {
    console.error(
      `Error fetching city and state for Facility ID ${facilityId}:`,
      error.message || error
    );
    return { city: "N/A", state: "N/A" };
  }
};

/**
 * Searches for locations (cities, zip codes) using OpenStreetMap Nominatim API.
 * @param {string} query - The search string.
 * @returns {Promise<Array>} - A list of location suggestions.
 */
export const searchLocations = async (query) => {
  if (!query || query.length < 3) return [];

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          addressdetails: 1,
          limit: 5,
          countrycodes: "us", // Limit to US as per project scope
        },
        headers: {
          "User-Agent": "KampScout/1.0", // Nominatim requires a User-Agent
        },
      }
    );

    return response.data.map((item) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      address: item.address,
    }));
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
};
