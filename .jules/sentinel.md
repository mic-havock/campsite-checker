## 2024-05-24 - [Sanitize dangerouslySetInnerHTML in FacilityDetails]
**Vulnerability:** XSS (Cross-Site Scripting) vulnerability where unescaped/unsanitized data (`facility.FacilityDescription` and `facility.FacilityDirections`) was rendered directly into the DOM using React's `dangerouslySetInnerHTML`.
**Learning:** External API data or CMS content rendered directly using `dangerouslySetInnerHTML` must always be sanitized before injection to prevent XSS attacks, even if the source is considered trustworthy.
**Prevention:** Always use a sanitation library like `dompurify` (e.g., `DOMPurify.sanitize(content)`) before passing data to `dangerouslySetInnerHTML`.
## 2024-03-20 - [XSS Vulnerability in FacilityDetails]
**Vulnerability:** Cross-Site Scripting (XSS) via `dangerouslySetInnerHTML`. The `FacilityDetails` component was rendering `facility.FacilityDescription` and `facility.FacilityDirections` without sanitization.
**Learning:** React's `dangerouslySetInnerHTML` is aptly named; rendering untrusted data directly from external sources (like a facility API) can expose the application to XSS attacks if the data contains malicious scripts.
**Prevention:** Always sanitize any dynamic or untrusted HTML strings using a well-tested library like `dompurify` before passing them to `dangerouslySetInnerHTML`.
