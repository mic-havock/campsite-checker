
## 2024-03-21 - [Date Parsing Optimization]
**Learning:** Instantiating `new Date()` within loops or array operations (like mapping over API response dates) introduces substantial overhead when processing large datasets, such as availability grids.
**Action:** When extracting components from standard ISO 8601 date strings, prefer basic string methods like `substring(0, 10)` over creating `Date` objects if full date validation/manipulation is not required.
