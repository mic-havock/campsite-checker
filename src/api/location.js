import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

//Get facility address by facility ID
export const getFacilityAddress = async (facilityId) => {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/facilities/${facilityId}/addresses`
    );
    // Filter the response to include only city and state
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

//Get city and state of a facility
export const fetchCityAndState = async (facilityId) => {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  try {
    const addressData = await getFacilityAddress(facilityId);
    if (addressData && addressData.length > 0) {
      const { city, state } = addressData[0]; // Take the first address entry
      return {
        city: city || "Unknown City",
        state: state || "Unknown State",
      };
    }

    // Default response if no valid data is found
    return { city: "Unknown City", state: "Unknown State" };
  } catch (error) {
    console.error(
      `Error fetching city and state for Facility ID ${facilityId}:`,
      error.message || error
    );
    // Default response in case of error
    return { city: "Unknown City", state: "Unknown State" };
  }
};
