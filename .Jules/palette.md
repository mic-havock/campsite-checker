## 2026-03-20 - Keyboard Accessibility Event Bubbling
**Learning:** When making wrapper elements (like modal overlays) keyboard accessible with `onKeyDown` handlers, events from focusable child elements (like buttons inside the modal) will bubble up and trigger the wrapper's handler.
**Action:** Always check `e.target === e.currentTarget` for interaction keys (like 'Enter' or 'Space') on wrapper elements to ensure the interaction was intended for the wrapper and not a child element.
