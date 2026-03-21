
## 2024-03-21 - [Date Parsing Optimization]
**Learning:** Instantiating `new Date()` within loops or array operations (like mapping over API response dates) introduces substantial overhead when processing large datasets, such as availability grids.
**Action:** When extracting components from standard ISO 8601 date strings, prefer basic string methods like `substring(0, 10)` over creating `Date` objects if full date validation/manipulation is not required.
## 2026-03-20 - Optimize Map initializations
**Learning:** The codebase deduplicates large object arrays preserving insertion order. The standard `new Map(array.map(...))` triggers large intermediate array allocations and causes performance bottlenecks here.
**Action:** Use a basic `for...of` loop with `Map.set()` instead for memory-efficient key-based deduplication.
## 2024-05-24 - N+1 Queries in Component Re-Renders
**Learning:** Components mapping over large arrays (like rows in an Ag-Grid component) and initiating independent API fetches per row (`fetchCityAndState` for `FacilityID`) can cause severe N+1 query bottlenecks if the results aren't cached. Because React re-renders might trigger these effect loops repeatedly, identical backend requests flood the network pane.
**Action:** When making row-by-row API calls within `Promise.all` in `useEffect`, always implement an in-memory application-level cache (like a simple ES6 `Map`) at the API module level to intercept identical requests and serve them instantly, especially for static or rarely-changing data like location details.
