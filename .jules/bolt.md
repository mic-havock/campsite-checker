# Performance Optimization Log

## 2025-05-22: Memoized Campsite Details Fetching
- **Issue:** `ReservationCard` components were making redundant `fetchCampsiteDetails` API calls for the same `campsiteId`, especially when multiple reservations for the same site were displayed.
- **Optimization:** Implemented a promise-based cache using `Map` in `src/api/campsites.js`.
- **Impact:**
    - Eliminated duplicate concurrent network requests for the same `campsiteId`.
    - Subsequent requests for the same ID are served instantly from memory (0ms latency).
    - Reduced server load and improved frontend responsiveness.
- **Verification:** Benchmarked with a script showing reduction from $N$ calls to 1 call for concurrent requests and near-zero latency for sequential hits.
