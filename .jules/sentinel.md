## 2024-05-24 - [Sanitize dangerouslySetInnerHTML in FacilityDetails]
**Vulnerability:** XSS (Cross-Site Scripting) vulnerability where unescaped/unsanitized data (`facility.FacilityDescription` and `facility.FacilityDirections`) was rendered directly into the DOM using React's `dangerouslySetInnerHTML`.
**Learning:** External API data or CMS content rendered directly using `dangerouslySetInnerHTML` must always be sanitized before injection to prevent XSS attacks, even if the source is considered trustworthy.
**Prevention:** Always use a sanitation library like `dompurify` (e.g., `DOMPurify.sanitize(content)`) before passing data to `dangerouslySetInnerHTML`.
