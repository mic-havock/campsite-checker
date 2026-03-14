## 2024-03-01 - Accessible Calendar Clickable Elements
**Learning:** Custom calendar implementations often use `div` elements for days, which are inaccessible by default when clicked. When a day acts as a button (e.g., to set availability alerts), it needs keyboard support (Enter/Space) and proper ARIA roles/labels to be discovered by screen readers.
**Action:** When implementing clickable `div`s, always add `role="button"`, `tabIndex={0}`, an `onKeyDown` handler for Enter/Space, and a descriptive `aria-label`.
