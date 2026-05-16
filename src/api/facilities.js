import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Serializes optional numeric query params without dropping valid `0` coordinates.
 * @param {unknown} value
 * @returns {number|string}
 */
const serializeNumericSearchParam = (value) => {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : "";
};

/**
 * @param {object} params
 * @param {string} [params.query]
 * @param {string} [params.state]
 * @param {number|string} [params.limit] — Recreation.gov caps this (typically 50).
 * @param {number|string} [params.offset] — Pagination offset; use blocks equal to limit.
 * @param {number|string} [params.latitude] — North–south degrees (caller passes standard latitude).
 * @param {number|string} [params.longitude] — East–west degrees (caller passes standard longitude).
 * @param {number|string} [params.radius]
 * @param {string} [params.sort]
 */
export const getFacilities = async (params) => {
  try {
    const offsetParsed = Number(params.offset);
    const includeOffset =
      params.offset !== undefined &&
      params.offset !== "" &&
      Number.isFinite(offsetParsed);

    /**
     * Proxied RIDB query uses `latitude` / `longitude` names but expects values swapped
     * relative to normal WGS84 assignment (longitude sent as `latitude`, latitude as `longitude`).
     */
    const requestParams = {
      query: params.query ?? "",
      state: params.state ?? "",
      latitude: serializeNumericSearchParam(params.longitude),
      longitude: serializeNumericSearchParam(params.latitude),
      radius: serializeNumericSearchParam(params.radius),
      sort: params.sort || "ID",
    };

    if (params.limit !== undefined && params.limit !== "") {
      requestParams.limit = params.limit;
    }
    if (includeOffset) {
      requestParams.offset = offsetParsed;
    }

    const response = await axios.get(`${BASE_URL}/facilities`, {
      params: requestParams,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching facilities:", error);
    throw error;
  }
};
