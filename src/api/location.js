import axios from "axios";

import { STATES } from "../config/states";

const BASE_URL = import.meta.env?.VITE_BASE_URL || "http://localhost:3000/api";

/**
 * Idle gap after each outbound Nominatim reverse HTTP call.
 * OSM nominatim.openstreetmap.org requires ~1 req/sec for client apps; tighter bursts risk 429 or blocks.
 * Set `VITE_NOMINATIM_REVERSE_GAP_MS=0` for self-hosted Nominatim or a proxied/geocoder backend you control.
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */
const NOMINATIM_REVERSE_GAP_MS = (() => {
  const raw = import.meta.env?.VITE_NOMINATIM_REVERSE_GAP_MS;
  if (raw === "") {
    return 1000;
  }
  if (raw === "0") {
    return 0;
  }
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return Math.floor(parsed);
  }
  return 1000;
})();

/** Serializes outbound reverse requests so cumulative rate stays polite (unless gap is 0). */
let nominatimReverseChain = Promise.resolve();

/**
 * Runs a reverse-geocode HTTP call; optional throttle between successive calls via {@link NOMINATIM_REVERSE_GAP_MS}.
 * @template T
 * @param {() => Promise<T>} task
 * @returns {Promise<T>}
 */
const runNominatimReverseQueued = (task) => {
  const run = nominatimReverseChain.then(() => task());
  nominatimReverseChain = run
    .catch(() => undefined)
    .then(
      () =>
        new Promise((resolve) => {
          if (NOMINATIM_REVERSE_GAP_MS <= 0) {
            resolve(undefined);
            return;
          }
          setTimeout(resolve, NOMINATIM_REVERSE_GAP_MS);
        }),
    );
  return run;
};

const locationCache = new Map();

/** Caches `{ city, state }` keyed by coarse coordinates. */
const reverseGeocodeCache = new Map();

const UNKNOWN_PLACEHOLDER = "N/A";

/** @typedef {{ latitude: number, longitude: number }} LatLngPair */

/**
 * Returns facility coordinates from GEOJSON Point or Recreation.gov latitude/longitude fields.
 * @param {object} facilityRecord
 * @returns {LatLngPair | null}
 */
const getFacilityCoordinates = (facilityRecord) => {
  if (!facilityRecord || typeof facilityRecord !== "object") {
    return null;
  }

  const geoJson = facilityRecord.GEOJSON;
  if (
    geoJson &&
    typeof geoJson.TYPE === "string" &&
    geoJson.TYPE.trim().toLowerCase() === "point" &&
    Array.isArray(geoJson.COORDINATES) &&
    geoJson.COORDINATES.length >= 2
  ) {
    const [longitude, latitude] = geoJson.COORDINATES;
    if (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return { latitude, longitude };
    }
  }

  const { FacilityLatitude: lat, FacilityLongitude: lng } = facilityRecord;
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return { latitude: lat, longitude: lng };
  }

  return null;
};

/**
 * @param {string | undefined} value
 * @returns {boolean}
 */
const isMissingOrNa = (value) => {
  if (value === undefined || value === null) {
    return true;
  }
  const trimmed = String(value).trim();
  return trimmed.length === 0 || trimmed.toUpperCase() === UNKNOWN_PLACEHOLDER;
};

/**
 * Maps OSM/US address envelope to USPS-style state code via ISO3166 or full state name match.
 * @param {Record<string, string | undefined>} addressLike - Nominatim `address` object.
 * @returns {string} Two-letter code or empty string if unknown.
 */
export const resolveUsStateAbbreviation = (addressLike) => {
  const iso3166lvl4 =
    typeof addressLike["ISO3166-2-lvl4"] === "string"
      ? addressLike["ISO3166-2-lvl4"].trim().toUpperCase()
      : "";
  if (iso3166lvl4.length >= 5 && iso3166lvl4.slice(0, 3) === "US-") {
    return iso3166lvl4.slice(3).toUpperCase();
  }

  const stateFull =
    typeof addressLike.state === "string" ? addressLike.state.trim() : "";
  if (stateFull.length > 0) {
    const lower = stateFull.toLowerCase();
    if (
      lower === "district of columbia" ||
      lower === "washington dc" ||
      lower === "washington, d.c."
    ) {
      return "DC";
    }
    const match = STATES.find(
      (entry) => entry.name.toLowerCase() === lower,
    );
    if (match) {
      return match.code;
    }
  }

  return "";
};

/**
 * Picks a human-readable locality label from Nominatim address facets.
 * @param {Record<string, string | undefined>} addressLike
 * @returns {string}
 */
const pickLocalityFromReverseAddress = (addressLike) => {
  const tiers = [
    "city",
    "town",
    "village",
    "hamlet",
    "suburb",
    "municipality",
    "county",
    "display_name",
  ];
  for (const key of tiers) {
    const raw = addressLike[key];
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return "";
};

/**
 * Reverse-geocodes latitude/longitude to city and state via Nominatim (US-centric).
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{ city: string, state: string }>}
 */
export const reverseGeocodeCityState = async (latitude, longitude) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      city: UNKNOWN_PLACEHOLDER,
      state: UNKNOWN_PLACEHOLDER,
    };
  }

  const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey);
  }

  const fetchPromise = runNominatimReverseQueued(async () => {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat: latitude,
          lon: longitude,
          format: "json",
          addressdetails: 1,
          zoom: 10,
        },
        headers: {
          "User-Agent": "KampScout/1.0",
        },
      },
    );

    const body = response.data;
    if (!body || typeof body !== "object") {
      return {
        city: UNKNOWN_PLACEHOLDER,
        state: UNKNOWN_PLACEHOLDER,
      };
    }

    /** @type {Record<string, string | undefined>} */
    const narrowed = {};

    /** @type {unknown} */
    const rawAddressRecord = body.address;

    if (typeof rawAddressRecord === "object" && rawAddressRecord !== null) {
      Object.keys(rawAddressRecord).forEach((key) => {
        const maybe = rawAddressRecord[key];
        narrowed[key] = typeof maybe === "string" ? maybe : undefined;
      });
      if (
        narrowed.display_name === undefined &&
        typeof body.display_name === "string"
      ) {
        narrowed.display_name = body.display_name;
      }
    }

    const locality = pickLocalityFromReverseAddress(narrowed);
    const stateCode = resolveUsStateAbbreviation(narrowed);

    return {
      city:
        locality !== "" ? locality.toUpperCase() : UNKNOWN_PLACEHOLDER,
      state:
        stateCode !== "" ? stateCode.toUpperCase() : UNKNOWN_PLACEHOLDER,
    };
  }).catch((error) => {
    reverseGeocodeCache.delete(cacheKey);
    console.error("Error reverse-geocoding location:", error.message || error);
    return {
      city: UNKNOWN_PLACEHOLDER,
      state: UNKNOWN_PLACEHOLDER,
    };
  });

  reverseGeocodeCache.set(cacheKey, fetchPromise);

  return fetchPromise;
};

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

/**
 * Loads city/state from the Recreation.gov addresses API, then fills missing pieces
 * with Nominatim reverse-geocode using facility GEOJSON/Facility lat-lng fields.
 * @param {string} facilityId
 * @param {object|null|undefined} [facilityRecord] - Raw facility RECDATA row (coordinates fallback).
 * @returns {Promise<{ city: string, state: string }>}
 */
export const fetchCityAndState = async (facilityId, facilityRecord = null) => {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  let city = UNKNOWN_PLACEHOLDER;
  let state = UNKNOWN_PLACEHOLDER;

  try {
    const addressData = await getFacilityAddress(facilityId);
    if (addressData && addressData.length > 0) {
      const hit = addressData[0];
      if (!isMissingOrNa(hit.city)) {
        city = String(hit.city).trim().toUpperCase();
      }
      if (!isMissingOrNa(hit.state)) {
        state = String(hit.state).trim().toUpperCase();
      }
    }
  } catch (error) {
    console.error(
      `Error fetching city and state for Facility ID ${facilityId}:`,
      error.message || error,
    );
  }

  const needCity = isMissingOrNa(city);
  const needState = isMissingOrNa(state);
  if (!needCity && !needState) {
    return { city, state };
  }

  if (!facilityRecord || typeof facilityRecord !== "object") {
    return { city, state };
  }

  const coords = getFacilityCoordinates(facilityRecord);
  if (!coords) {
    return { city, state };
  }

  const reversed = await reverseGeocodeCityState(
    coords.latitude,
    coords.longitude,
  );

  return {
    city: needCity && !isMissingOrNa(reversed.city) ? reversed.city : city,
    state: needState && !isMissingOrNa(reversed.state) ? reversed.state : state,
  };
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
