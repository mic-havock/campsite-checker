import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Fetches the city and state for a facility by its ID.
 * @param {string|number} facilityId - The ID of the facility.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects with `city` and `state`.
 * @throws {Error} - Throws an error if the request fails.
 */
export const getFacilityAddress = async (facilityId) => {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/facilities/${facilityId}/addresses`
    );
    console.log("response", JSON.stringify(response));
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

// Function to fetch city and state using HERE API
// Function to fetch city and state using the getFacilityAddress API
export const fetchCityAndState = async (facilityId) => {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }
  console.log("facilityId", facilityId);
  try {
    const addressData = await getFacilityAddress(facilityId);
    console.log("address data", addressData);
    // Assuming the API response has the relevant data in RECDATA
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
