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

/**
 * sessionStorage keys for persisting resolved location lookups across reloads.
 * Bump the `.vN` suffix if the persisted shape changes.
 */
const REVERSE_GEOCODE_STORAGE_KEY = "kampscoutReverseGeocodeCache.v1";
const FACILITY_ADDRESS_STORAGE_KEY = "kampscoutFacilityAddressCache.v1";

/**
 * Reads a JSON object from sessionStorage, returning an empty record on any failure
 * (corrupt JSON, quota errors, private browsing, SSR, etc.).
 * @param {string} key
 * @returns {Record<string, unknown>}
 */
const safeReadStorageRecord = (key) => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return {};
  }
  try {
    const raw = window.sessionStorage.getItem(key);
    if (typeof raw !== "string" || raw.length === 0) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      /** @type {Record<string, unknown>} */
      const narrowed = {};
      for (const k of Object.keys(parsed)) {
        narrowed[k] = parsed[k];
      }
      return narrowed;
    }
    return {};
  } catch {
    return {};
  }
};

/**
 * Best-effort persist of an object to sessionStorage. Silently no-ops on quota errors
 * so in-memory caches still work even when storage is unavailable.
 * @param {string} key
 * @param {Record<string, unknown>} value
 */
const safeWriteStorageRecord = (key, value) => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sessionStorage may be full or disabled; the in-memory Map still serves the rest of the session. */
  }
};

/**
 * Resolved-only shadow of {@link reverseGeocodeCache}, persisted to sessionStorage so
 * results survive a reload. Promises are never stored here — only their settled values.
 * @type {Record<string, { city: string, state: string }>}
 */
const resolvedReverseGeocode = (() => {
  /** @type {Record<string, { city: string, state: string }>} */
  const out = {};
  const raw = safeReadStorageRecord(REVERSE_GEOCODE_STORAGE_KEY);
  for (const key of Object.keys(raw)) {
    const value = raw[key];
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      /** @type {Record<string, unknown>} */
      const obj = value;
      const city = obj.city;
      const state = obj.state;
      if (typeof city === "string" && typeof state === "string") {
        out[key] = { city, state };
      }
    }
  }
  return out;
})();

/**
 * Resolved-only shadow of {@link locationCache}, persisted to sessionStorage. Stored
 * arrays mirror the resolved value of {@link getFacilityAddress}.
 * @type {Record<string, Array<{ city: string, state: string }>>}
 */
const resolvedFacilityAddress = (() => {
  /** @type {Record<string, Array<{ city: string, state: string }>>} */
  const out = {};
  const raw = safeReadStorageRecord(FACILITY_ADDRESS_STORAGE_KEY);
  for (const key of Object.keys(raw)) {
    const value = raw[key];
    if (Array.isArray(value)) {
      /** @type {Array<{ city: string, state: string }>} */
      const rows = [];
      for (const entry of value) {
        if (
          entry !== null &&
          typeof entry === "object" &&
          !Array.isArray(entry)
        ) {
          /** @type {Record<string, unknown>} */
          const obj = entry;
          const city = typeof obj.city === "string" ? obj.city : "";
          const state = typeof obj.state === "string" ? obj.state : "";
          rows.push({ city, state });
        }
      }
      out[key] = rows;
    }
  }
  return out;
})();

// Seed the in-memory promise caches with already-resolved values from sessionStorage
// so the existing async code paths short-circuit immediately on reload.
for (const key of Object.keys(resolvedReverseGeocode)) {
  reverseGeocodeCache.set(key, Promise.resolve(resolvedReverseGeocode[key]));
}
for (const id of Object.keys(resolvedFacilityAddress)) {
  locationCache.set(id, Promise.resolve(resolvedFacilityAddress[id]));
}

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
  })
    .then((resolved) => {
      // Write-through so the value survives a page reload (sessionStorage).
      resolvedReverseGeocode[cacheKey] = resolved;
      safeWriteStorageRecord(
        REVERSE_GEOCODE_STORAGE_KEY,
        resolvedReverseGeocode,
      );
      return resolved;
    })
    .catch((error) => {
      // Network/HTTP failures are NOT cached so the next attempt can retry.
      reverseGeocodeCache.delete(cacheKey);
      delete resolvedReverseGeocode[cacheKey];
      safeWriteStorageRecord(
        REVERSE_GEOCODE_STORAGE_KEY,
        resolvedReverseGeocode,
      );
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

  const cacheId = String(facilityId);

  // Cache the promise to prevent concurrent identical requests AND short-circuit
  // on already-hydrated values from sessionStorage (seeded at module load).
  if (!locationCache.has(cacheId)) {
    const fetchPromise = axios
      .get(`${BASE_URL}/facilities/${cacheId}/addresses`)
      .then((response) => {
        const recData = response?.data?.RECDATA;
        const rows = Array.isArray(recData)
          ? recData.map((item) => ({
              city: typeof item?.City === "string" ? item.City : "",
              state:
                typeof item?.AddressStateCode === "string"
                  ? item.AddressStateCode
                  : "",
            }))
          : [];
        // Write-through so the value survives a page reload (sessionStorage).
        resolvedFacilityAddress[cacheId] = rows;
        safeWriteStorageRecord(
          FACILITY_ADDRESS_STORAGE_KEY,
          resolvedFacilityAddress,
        );
        return rows;
      })
      .catch((error) => {
        locationCache.delete(cacheId);
        delete resolvedFacilityAddress[cacheId];
        safeWriteStorageRecord(
          FACILITY_ADDRESS_STORAGE_KEY,
          resolvedFacilityAddress,
        );
        console.error(
          "Error fetching facility address:",
          error.message || error,
        );
        throw error;
      });

    locationCache.set(cacheId, fetchPromise);
  }

  return locationCache.get(cacheId);
};

/**
 * Synchronous lookup of an already-resolved city/state pair without triggering any
 * network request. Returns `null` when no cached answer is available yet, so callers
 * can fall back to {@link fetchCityAndState}.
 *
 * Use this for cheap "do I already know this?" checks (e.g. building grid stubs on
 * remount) to skip the placeholder UI when sessionStorage already has the answer.
 *
 * @param {string | number | null | undefined} facilityId
 * @param {object | null | undefined} [facilityRecord] - Raw RECDATA row (used for the
 *   coordinate-based reverse-geocode fallback when the addresses API was missing pieces).
 * @returns {{ city: string, state: string } | null}
 */
export const getCachedCityAndState = (facilityId, facilityRecord = null) => {
  if (facilityId === null || facilityId === undefined || facilityId === "") {
    return null;
  }
  const id = String(facilityId);
  const addressData = resolvedFacilityAddress[id];
  if (addressData === undefined) {
    // The addresses API call hasn't completed (and persisted) yet for this facility.
    return null;
  }

  let city = UNKNOWN_PLACEHOLDER;
  let state = UNKNOWN_PLACEHOLDER;
  if (Array.isArray(addressData) && addressData.length > 0) {
    const hit = addressData[0];
    if (!isMissingOrNa(hit?.city)) {
      city = String(hit.city).trim().toUpperCase();
    }
    if (!isMissingOrNa(hit?.state)) {
      state = String(hit.state).trim().toUpperCase();
    }
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

  const reverseKey = [
    coords.latitude.toFixed(5),
    coords.longitude.toFixed(5),
  ].join(",");
  const reversed = resolvedReverseGeocode[reverseKey];
  if (reversed === undefined) {
    // Address call resolved, but reverse fallback hasn't — let async path fill it in.
    return null;
  }

  return {
    city:
      needCity && !isMissingOrNa(reversed.city) ? reversed.city : city,
    state:
      needState && !isMissingOrNa(reversed.state) ? reversed.state : state,
  };
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
