import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const getFacilityAddress = async (facilityId) => {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/facilities/${facilityId}/addresses`
    );
    const addressData = response.data.RECDATA.map((item) => ({
      city: item.City,
      state: item.AddressStateCode,
    }));

    return addressData;
  } catch (error) {
    console.error("Error fetching facility address:", error.message || error);
    throw error;
  }
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
        city: city || "Unknown City",
        state: state || "Unknown State",
      };
    }

    return { city: "Unknown City", state: "Unknown State" };
  } catch (error) {
    console.error(
      `Error fetching city and state for Facility ID ${facilityId}:`,
      error.message || error
    );
    return { city: "Unknown City", state: "Unknown State" };
  }
};
