import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { fetchCampsitesByFacility } from "../../api/campsites";
import { getFacilities } from "../../api/facilities";
import { resolveUsStateAbbreviation } from "../../api/location";
import { CONTENT } from "../../config/content";
import { STATES } from "../../config/states";

import LoadingSpinner from "../Common/LoadingSpinner/LoadingSpinner";
import LocationAutocomplete from "../Common/LocationAutocomplete/LocationAutocomplete";

import FacilityDetails from "./FacilityDetails";
import FacilityGrid from "./FacilityGrid";
import FacilitiesMap from "./Map/FacilitiesMap";
import "./facilities-finder.scss";

const STORAGE_KEYS = {
  SELECTED_FACILITY: "selectedFacility",
  SEARCH_RESULTS: "searchResults",
  SEARCH_PARAMS: "searchParams",
};

/** Matches Recreation.gov facility search page size (see METADATA.SEARCH_PARAMETERS.LIMIT). */
const FACILITY_PAGE_SIZE = 50;

/**
 * Reads result totals and paging info from a Recreation.gov-style payload.
 * @param {object|null|undefined} response
 * @returns {{ totalCount: number, currentCount: number, limit: number, offset: number }}
 */
const parseFacilityResponseMetadata = (response) => {
  const meta = response?.METADATA;
  const results = meta?.RESULTS;
  const params = meta?.SEARCH_PARAMETERS;
  const totalRaw = results?.TOTAL_COUNT;
  const currentRaw = results?.CURRENT_COUNT;
  const limitRaw = params?.LIMIT;
  const offsetRaw = params?.OFFSET;

  const toNonNegInt = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.trunc(value));
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const totalCount = toNonNegInt(totalRaw);
  const currentCount = toNonNegInt(currentRaw);
  const limitParsed = toNonNegInt(limitRaw);
  const limit = limitParsed > 0 ? limitParsed : FACILITY_PAGE_SIZE;
  const offset = toNonNegInt(offsetRaw);

  return { totalCount, currentCount, limit, offset };
};

/**
 * Merges two facility arrays, deduping by FacilityID (first occurrence wins).
 * @param {object[]} primary
 * @param {object[]} secondary
 * @returns {object[]}
 */
const mergeFacilitiesById = (primary, secondary) => {
  const merged = new Map();
  for (const item of primary) {
    if (item && item.FacilityID != null) {
      merged.set(String(item.FacilityID), item);
    }
  }
  for (const item of secondary) {
    if (
      item &&
      item.FacilityID != null &&
      !merged.has(String(item.FacilityID))
    ) {
      merged.set(String(item.FacilityID), item);
    }
  }
  return Array.from(merged.values());
};

/**
 * Reads coordinates from the location picker or session-restored payload (Nominatim uses string lat/lon).
 * @param {Record<string, unknown> | null | undefined} location
 * @returns {{ latitude: number, longitude: number } | null}
 */
const resolveSelectedLatLng = (location) => {
  if (!location || typeof location !== "object") {
    return null;
  }
  const latRaw = location.lat ?? location.latitude;
  const lonRaw = location.lon ?? location.longitude;
  const latitude =
    typeof latRaw === "number"
      ? latRaw
      : Number.parseFloat(String(latRaw ?? ""));
  const longitude =
    typeof lonRaw === "number"
      ? lonRaw
      : Number.parseFloat(String(lonRaw ?? ""));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
};

/**
 * @param {{ totalCount: number, recLength: number, offset: number, limit: number }} args
 * @returns {boolean}
 */
const streamHasMorePages = ({ totalCount, recLength, offset, limit }) => {
  if (totalCount > 0) {
    return offset + recLength < totalCount;
  }
  return recLength === limit;
};

const FacilitiesFinder = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedState, setSelectedState] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  /** Plain text in the location field; non-empty without coordinates means search must not run. */
  const [locationQueryDraft, setLocationQueryDraft] = useState("");
  const [radius, setRadius] = useState("");
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAppendingResults, setIsAppendingResults] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "map"
  /**
   * Each entry is one Recreation.gov page (offset = index * FACILITY_PAGE_SIZE).
   */
  const [facilityFetchStack, setFacilityFetchStack] = useState([]);
  const facilityFetchStackRef = useRef([]);
  /** TOTAL_COUNT from METADATA for the active search (single API stream). */
  const [totalReportedCount, setTotalReportedCount] = useState(0);
  const resultsPaginationRef = useRef(null);

  const facilities = useMemo(
    () =>
      facilityFetchStack.reduce(
        (acc, chunk) => mergeFacilitiesById(acc, chunk.rows),
        [],
      ),
    [facilityFetchStack],
  );

  useEffect(() => {
    facilityFetchStackRef.current = facilityFetchStack;
  }, [facilityFetchStack]);

  const hasMoreResults =
    facilityFetchStack.length > 0 &&
    facilityFetchStack[facilityFetchStack.length - 1].hasMoreAfter;

  // Storage management functions
  const clearStorage = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.SELECTED_FACILITY);
    sessionStorage.removeItem(STORAGE_KEYS.SEARCH_RESULTS);
    sessionStorage.removeItem(STORAGE_KEYS.SEARCH_PARAMS);
  }, []);

  const saveToStorage = useCallback((key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }, []);

  // Handle viewport resize for responsive layout (mobile vs desktop)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load from storage on mount
  useEffect(() => {
    const savedResults = sessionStorage.getItem(STORAGE_KEYS.SEARCH_RESULTS);
    const savedParams = sessionStorage.getItem(STORAGE_KEYS.SEARCH_PARAMS);

    if (savedResults && savedParams) {
      const params = JSON.parse(savedParams);
      setInputValue(params.query || "");
      setSelectedState(params.state || "");
      setSelectedLocation(params.selectedLocation || null);
      setLocationQueryDraft(
        typeof params.selectedLocation?.display_name === "string"
          ? params.selectedLocation.display_name
          : "",
      );
      setRadius(
        params.radius !== undefined && params.radius !== ""
          ? params.radius
          : "",
      );
      setHasSearched(true);
      const list = JSON.parse(savedResults);
      const tot =
        typeof params.totalReportedCount === "number"
          ? params.totalReportedCount
          : 0;
      setTotalReportedCount(tot);

      if (
        Array.isArray(params.facilityFetchStack) &&
        params.facilityFetchStack.length > 0
      ) {
        setFacilityFetchStack(params.facilityFetchStack);
      } else {
        const legacyHasMore =
          typeof params.hasMoreResults === "boolean"
            ? params.hasMoreResults
            : list.length === FACILITY_PAGE_SIZE &&
              (tot === 0 || list.length < tot);
        setFacilityFetchStack([
          {
            rows: list,
            fetchOffset: 0,
            hasMoreAfter: legacyHasMore,
          },
        ]);
      }
    }
  }, []);

  /**
   * Geo + optional state: without state, one keyword/geo stream; with state only, one state/geo stream;
   * with both, merges two RIDB-style streams (keyword+geo and state+geo), matching legacy behavior.
   */
  const fetchFacilitiesAtOffset = useCallback(
    async (offset, queryWithState, resolvedRadiusMiles) => {
      const limit = FACILITY_PAGE_SIZE;
      const coords = resolveSelectedLatLng(selectedLocation);
      const geoParams =
        coords !== null
          ? {
              latitude: coords.latitude,
              longitude: coords.longitude,
              radius: resolvedRadiusMiles,
            }
          : {
              latitude: "",
              longitude: "",
              radius: "",
            };

      const hasGeo = coords !== null;

      if (selectedState && hasGeo) {
        const [responseKeywordStateGeo, responseStateFilteredGeo] =
          await Promise.all([
            getFacilities({
              query: queryWithState,
              ...geoParams,
              offset,
              limit,
            }),
            getFacilities({
              query: inputValue,
              state: selectedState,
              ...geoParams,
              offset,
              limit,
            }),
          ]);

        const rec = mergeFacilitiesById(
          responseKeywordStateGeo.RECDATA || [],
          responseStateFilteredGeo.RECDATA || [],
        );
        const meta1 = parseFacilityResponseMetadata(responseKeywordStateGeo);
        const meta2 = parseFacilityResponseMetadata(responseStateFilteredGeo);
        const limitResolved =
          meta1.limit > 0 ? meta1.limit : meta2.limit > 0 ? meta2.limit : limit;

        const len1 = (responseKeywordStateGeo.RECDATA || []).length;
        const len2 = (responseStateFilteredGeo.RECDATA || []).length;

        const hasMore1 = streamHasMorePages({
          totalCount: meta1.totalCount,
          recLength: len1,
          offset,
          limit: limitResolved,
        });
        const hasMore2 = streamHasMorePages({
          totalCount: meta2.totalCount,
          recLength: len2,
          offset,
          limit: limitResolved,
        });

        return {
          facilities: rec,
          totalReportedCount: Math.max(meta1.totalCount, meta2.totalCount),
          hasMore: hasMore1 || hasMore2,
        };
      }

      if (selectedState) {
        const response = await getFacilities({
          query: inputValue,
          state: selectedState,
          ...geoParams,
          offset,
          limit,
        });
        const rec = response.RECDATA || [];
        const meta = parseFacilityResponseMetadata(response);
        return {
          facilities: rec,
          totalReportedCount: meta.totalCount,
          hasMore: streamHasMorePages({
            totalCount: meta.totalCount,
            recLength: rec.length,
            offset,
            limit: meta.limit,
          }),
        };
      }

      const response1 = await getFacilities({
        query: queryWithState,
        ...geoParams,
        offset,
        limit,
      });
      const rec1 = response1.RECDATA || [];
      const meta1 = parseFacilityResponseMetadata(response1);

      return {
        facilities: rec1,
        totalReportedCount: meta1.totalCount,
        hasMore: streamHasMorePages({
          totalCount: meta1.totalCount,
          recLength: rec1.length,
          offset,
          limit: meta1.limit,
        }),
      };
    },
    [selectedLocation, selectedState, inputValue],
  );

  const persistSearchSession = useCallback(
    (fetchStack, resolvedRadiusMiles, totalCount) => {
      const flat = fetchStack.reduce(
        (acc, chunk) => mergeFacilitiesById(acc, chunk.rows),
        [],
      );
      saveToStorage(STORAGE_KEYS.SEARCH_RESULTS, flat);
      saveToStorage(STORAGE_KEYS.SEARCH_PARAMS, {
        query: inputValue,
        state: selectedState,
        selectedLocation,
        radius:
          resolveSelectedLatLng(selectedLocation) !== null
            ? resolvedRadiusMiles
            : "",
        facilityFetchStack: fetchStack,
        totalReportedCount: totalCount,
      });
    },
    [inputValue, selectedState, selectedLocation, saveToStorage],
  );

  const appendNextFederalPage = useCallback(async () => {
    const locationDraftTrimmed = locationQueryDraft.trim();
    const needsLocationPick =
      locationDraftTrimmed !== "" &&
      resolveSelectedLatLng(selectedLocation) === null;

    if (needsLocationPick) {
      setError(
        "Choose a location from the suggestions list to search near that place.",
      );
      return;
    }

    setLoading(true);
    setIsAppendingResults(true);
    setError("");
    setSelectedFacility(null);
    const stateInfo = STATES.find((state) => state.code === selectedState);
    const stateName = stateInfo ? stateInfo.name : "";
    const queryWithState = stateName
      ? `${inputValue} ${stateName}`.trim()
      : inputValue;
    const coordsForPagination = resolveSelectedLatLng(selectedLocation);
    const resolvedRadiusMiles =
      coordsForPagination === null
        ? ""
        : radius === "" || Number.isNaN(Number(radius))
          ? 25
          : Number(radius);

    const nextOffset =
      facilityFetchStackRef.current.length * FACILITY_PAGE_SIZE;

    try {
      const {
        facilities: pageRows,
        totalReportedCount: reportedTotal,
        hasMore,
      } = await fetchFacilitiesAtOffset(
        nextOffset,
        queryWithState,
        resolvedRadiusMiles,
      );

      const prev = facilityFetchStackRef.current;
      const nextStack = [
        ...prev,
        {
          rows: pageRows,
          fetchOffset: nextOffset,
          hasMoreAfter: hasMore,
        },
      ];

      setFacilityFetchStack(nextStack);
      facilityFetchStackRef.current = nextStack;
      setTotalReportedCount(reportedTotal);

      persistSearchSession(nextStack, resolvedRadiusMiles, reportedTotal);

      requestAnimationFrame(() => {
        if (resultsPaginationRef.current) {
          resultsPaginationRef.current.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      });
    } catch (err) {
      console.error(err);
      setError("Error fetching facilities");
    } finally {
      setLoading(false);
      setIsAppendingResults(false);
    }
  }, [
    selectedState,
    selectedLocation,
    inputValue,
    locationQueryDraft,
    radius,
    fetchFacilitiesAtOffset,
    persistSearchSession,
  ]);

  const handleLoadMoreResults = () => {
    if (loading || !hasMoreResults) return;
    void appendNextFederalPage();
  };

  // Event handlers
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  /**
   * Stores the geocoded location and, when Nominatim includes a US state, syncs the State filter.
   * @param {Record<string, unknown> | null} location
   */
  const handleFacilityLocationSelect = useCallback((location) => {
    setSelectedLocation(location);
    if (!location || typeof location !== "object") {
      return;
    }
    const rawAddress = location.address;
    if (
      typeof rawAddress !== "object" ||
      rawAddress === null ||
      Array.isArray(rawAddress)
    ) {
      return;
    }
    /** @type {Record<string, string | undefined>} */
    const addressLike = {};
    for (const key of Object.keys(rawAddress)) {
      const val = rawAddress[key];
      addressLike[key] = typeof val === "string" ? val : undefined;
    }
    const code = resolveUsStateAbbreviation(addressLike);
    if (code !== "") {
      setSelectedState(code);
    }
  }, []);

  const hasLocationCoordinates = useMemo(
    () => resolveSelectedLatLng(selectedLocation) !== null,
    [selectedLocation],
  );

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const locationDraftTrimmed = locationQueryDraft.trim();
    const needsLocationPick =
      locationDraftTrimmed !== "" &&
      resolveSelectedLatLng(selectedLocation) === null;

    if (needsLocationPick) {
      setError(
        "Choose a location from the suggestions list to search near that place.",
      );
      return;
    }

    // Find the state name if a state code is selected
    const stateInfo = STATES.find((state) => state.code === selectedState);
    const stateName = stateInfo ? stateInfo.name : "";

    // Construct the query with state name if available
    const queryWithState = stateName
      ? `${inputValue} ${stateName}`.trim()
      : inputValue;

    setLoading(true);
    setError("");
    setSelectedFacility(null);

    try {
      const coordsForSubmit = resolveSelectedLatLng(selectedLocation);
      const resolvedRadiusMiles =
        coordsForSubmit === null
          ? ""
          : radius === "" || Number.isNaN(Number(radius))
            ? 25
            : Number(radius);

      const {
        facilities: nextFacilities,
        totalReportedCount: reportedTotal,
        hasMore,
      } = await fetchFacilitiesAtOffset(0, queryWithState, resolvedRadiusMiles);

      const initialStack = [
        {
          rows: nextFacilities,
          fetchOffset: 0,
          hasMoreAfter: hasMore,
        },
      ];

      setFacilityFetchStack(initialStack);
      facilityFetchStackRef.current = initialStack;
      setTotalReportedCount(reportedTotal);
      setHasSearched(true);

      if (coordsForSubmit !== null) {
        setRadius(resolvedRadiusMiles);
      }

      requestAnimationFrame(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });

      persistSearchSession(initialStack, resolvedRadiusMiles, reportedTotal);
    } catch (err) {
      console.error(err);
      setError("Error fetching facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSelectedState("");
    setSelectedLocation(null);
    setLocationQueryDraft("");
    setRadius("");
    setFacilityFetchStack([]);
    facilityFetchStackRef.current = [];
    setSelectedFacility(null);
    setHasSearched(false);
    setError("");
    setLoading(false);
    setIsAppendingResults(false);
    setTotalReportedCount(0);
    clearStorage();
  };

  const handleViewCampsites = async () => {
    if (!selectedFacility) return;

    try {
      const response = await fetchCampsitesByFacility(
        selectedFacility.FacilityID,
      );
      const campsites = response.RECDATA || [];
      saveToStorage(STORAGE_KEYS.SELECTED_FACILITY, selectedFacility);
      navigate("/campsites", {
        state: {
          campsites,
          facilityName: selectedFacility.FacilityName,
          facilityState: selectedFacility.FacilityStateCode,
        },
      });
    } catch (err) {
      console.error(err);
      setError("Error fetching campsites");
    }
  };

  const handleRowSelection = (row) => {
    setSelectedFacility(row);

    requestAnimationFrame(() => {
      const detailElement = document.getElementById("facility-details-section");
      if (detailElement) {
        detailElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    });
  };

  const generateCampgroundSchema = (facility) => {
    if (!facility) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Campground",
      name: facility.FacilityName,
      description: facility.FacilityDescription,
      url: `https://kampscout.com/facility/${facility.FacilityID}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: facility.FacilityCity,
        addressRegion: facility.FacilityStateCode,
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: facility.FacilityLatitude,
        longitude: facility.FacilityLongitude,
      },
      amenityFeature: (facility.FACILITYADDRESS || []).map((address) => ({
        "@type": "LocationFeatureSpecification",
        name: address.AddressType,
        value: true,
      })),
    };
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KampScout",
    url: "https://kampscout.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://kampscout.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const showFederalResultsFooter =
    facilities.length > 0 && (hasMoreResults || facilityFetchStack.length > 1);

  return (
    <>
      <Helmet>
        <title>Kamp Scout - Campsite Finder & Availability Alerts</title>
        <meta name="theme-color" content="#2b4c1c" />
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
        {selectedFacility && (
          <script type="application/ld+json">
            {JSON.stringify(generateCampgroundSchema(selectedFacility))}
          </script>
        )}
      </Helmet>
      <div className="facilities-finder">
        <div className="hero-section">
          <div className="hero-top-bar">
            <button
              onClick={() => navigate("/reservation-management")}
              className="alert-management-btn"
              aria-label="Manage Reservation Alerts"
            >
              {isMobile ? "Alerts" : "Manage Reservation Alerts"}
            </button>
          </div>
          <div className="hero-content">
            <img
              src="/kampscout.svg"
              alt="Kampscout Logo"
              className="hero-logo"
            />
            <p className="description">
              {CONTENT.FACILITIES_FINDER.DESCRIPTION}
            </p>
          </div>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="facilities-finder__form"
        >
          <div className="form-group keyword-group">
            <label htmlFor="campground-name">Keyword</label>
            <input
              id="campground-name"
              name="query"
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="e.g., Cougar Rock, Mount Rainier..."
            />
          </div>
          <div className="form-group state-group">
            <label htmlFor="state">State</label>
            <select
              id="state"
              name="state"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={hasLocationCoordinates}
              className={
                selectedState === ""
                  ? "facilities-finder__select--placeholder"
                  : undefined
              }
            >
              <option value="">State</option>
              {STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group location-group">
            <label htmlFor="location-search">Location</label>
            <LocationAutocomplete
              id="location-search"
              onLocationSelect={handleFacilityLocationSelect}
              onLocationQueryChange={setLocationQueryDraft}
              initialValue={selectedLocation?.display_name || ""}
              placeholder="City, county, ZIP, or full address…"
            />
          </div>

          <div className="form-group radius-group">
            <label htmlFor="radius">Radius (miles)</label>
            <select
              id="radius"
              name="radius"
              value={hasLocationCoordinates ? radius : ""}
              disabled={!hasLocationCoordinates}
              onChange={(e) => {
                const { value } = e.target;
                setRadius(value === "" ? "" : Number(value));
              }}
              className={[
                "facilities-finder__select--radius",
                radius === "" ? "facilities-finder__select--placeholder" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <option value="">Radius</option>
              <option value="5">5 miles</option>
              <option value="10">10 miles</option>
              <option value="25">25 miles</option>
            </select>
          </div>

          <div className="facilities-finder__form-actions">
            <button
              type="submit"
              className="facilities-finder__form-btn facilities-finder__form-btn--submit submit"
              disabled={loading}
            >
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <LoadingSpinner size="small" />
                  <span>Loading...</span>
                </div>
              ) : (
                "Search"
              )}
            </button>
            <button
              type="button"
              className="facilities-finder__form-btn facilities-finder__form-btn--clear clear"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}

        {hasSearched && (
          <>
            {facilities && facilities.length > 0 ? (
              <>
                <div className="view-toggle-container">
                  <button
                    className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => setViewMode("grid")}
                  >
                    Table View
                  </button>
                  <button
                    className={`view-toggle-btn ${viewMode === "map" ? "active" : ""}`}
                    onClick={() => setViewMode("map")}
                  >
                    Map View
                  </button>
                </div>

                {showFederalResultsFooter && (
                  <div
                    ref={resultsPaginationRef}
                    className="facilities-pagination facilities-pagination--load-more"
                    aria-label="Federal search results"
                  >
                    <p className="facilities-pagination__summary">
                      <span className="facilities-pagination__range">
                        {facilities.length.toLocaleString()}
                      </span>{" "}
                      {facilities.length === 1 ? "campground" : "campgrounds"}{" "}
                      loaded
                      {totalReportedCount > 0 ? (
                        <>
                          {" "}
                          · up to{" "}
                          <span className="facilities-pagination__total">
                            {totalReportedCount.toLocaleString()}
                          </span>{" "}
                          reported matches
                        </>
                      ) : null}
                    </p>
                    {hasMoreResults ? (
                      <div className="facilities-pagination__actions facilities-pagination__actions--single">
                        <button
                          type="button"
                          className="facilities-pagination__btn facilities-pagination__btn--primary"
                          onClick={handleLoadMoreResults}
                          disabled={loading}
                          aria-busy={isAppendingResults}
                        >
                          {isAppendingResults
                            ? "Loading…"
                            : "Load more results"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {viewMode === "grid" && (
                  <FacilityGrid
                    rowData={facilities}
                    onRowSelected={handleRowSelection}
                    applySelectedStateRowFilter={!selectedState}
                    selectedState={
                      selectedState
                        ? STATES.find((state) => state.code === selectedState)
                        : null
                    }
                  />
                )}
                {viewMode === "map" && (
                  <div className="map-col">
                    <FacilitiesMap
                      facilities={facilities}
                      onFacilitySelect={handleRowSelection}
                    />
                  </div>
                )}
              </>
            ) : (
              !loading && (
                <div className="no-results">
                  <p>No campgrounds found for your search.</p>
                </div>
              )
            )}
          </>
        )}

        {selectedFacility && (
          <FacilityDetails
            facility={selectedFacility}
            handleViewCampsites={handleViewCampsites}
          />
        )}
      </div>
    </>
  );
};

export default FacilitiesFinder;
