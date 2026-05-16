import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { searchLocations } from "../../../api/location";
import "./location-autocomplete.scss";

/**
 * Narrow Nominatim `address` to string fields so callers can derive US state.
 * @param {unknown} rawAddress
 * @returns {Record<string, string> | undefined}
 */
const normalizeNominatimAddressFields = (rawAddress) => {
  if (
    typeof rawAddress !== "object" ||
    rawAddress === null ||
    Array.isArray(rawAddress)
  ) {
    return undefined;
  }
  /** @type {Record<string, string>} */
  const out = {};
  for (const key of Object.keys(rawAddress)) {
    const val = rawAddress[key];
    if (typeof val === "string") {
      out[key] = val;
    }
  }
  return Object.keys(out).length ? out : undefined;
};

const LocationAutocomplete = ({
  onLocationSelect,
  onLocationQueryChange,
  placeholder = "City or Zip Code",
  initialValue = "",
  id,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (typeof onLocationQueryChange === "function") {
      onLocationQueryChange(query);
    }
  }, [query, onLocationQueryChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // If user changes input, clear selection to prevent stale coordinates
    onLocationSelect(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length >= 3) {
      setLoading(true);
      debounceTimerRef.current = setTimeout(async () => {
        const results = await searchLocations(value);
        setSuggestions(results);
        setShowSuggestions(true);
        setLoading(false);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    onLocationSelect({
      display_name: suggestion.display_name,
      lat: suggestion.lat,
      lon: suggestion.lon,
      address: normalizeNominatimAddressFields(suggestion.address),
    });
  };

  return (
    <div className="location-autocomplete" ref={containerRef}>
      <input
        id={id}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 3 && setShowSuggestions(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && <div className="autocomplete-loader">Loading...</div>}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="suggestion-item"
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

LocationAutocomplete.propTypes = {
  onLocationSelect: PropTypes.func.isRequired,
  /** Called with the current input text so parents can require picking a suggestion when non-empty. */
  onLocationQueryChange: PropTypes.func,
  placeholder: PropTypes.string,
  initialValue: PropTypes.string,
  id: PropTypes.string,
};

export default LocationAutocomplete;
