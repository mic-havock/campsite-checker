## 2024-03-20 - [XSS Vulnerability in FacilityDetails]
**Vulnerability:** Cross-Site Scripting (XSS) via `dangerouslySetInnerHTML`. The `FacilityDetails` component was rendering `facility.FacilityDescription` and `facility.FacilityDirections` without sanitization.
**Learning:** React's `dangerouslySetInnerHTML` is aptly named; rendering untrusted data directly from external sources (like a facility API) can expose the application to XSS attacks if the data contains malicious scripts.
**Prevention:** Always sanitize any dynamic or untrusted HTML strings using a well-tested library like `dompurify` before passing them to `dangerouslySetInnerHTML`.
