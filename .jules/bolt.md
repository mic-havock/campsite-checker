## 2026-03-20 - Optimize Map initializations
**Learning:** The codebase deduplicates large object arrays preserving insertion order. The standard `new Map(array.map(...))` triggers large intermediate array allocations and causes performance bottlenecks here.
**Action:** Use a basic `for...of` loop with `Map.set()` instead for memory-efficient key-based deduplication.
