import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

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
