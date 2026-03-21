## 2025-01-28 - Keyboard Accessibility in Modals and Forms
**Learning:** Found multiple modals lacking standard `Escape` key close behavior, and forms lacking proper semantic `id`/`htmlFor` associations and `aria-label`s for text inputs. Screen reader and keyboard-only users would be blocked from escaping or understanding inputs without placeholders.
**Action:** Ensure all future modal components incorporate an `Escape` key listener on mount. Require all form inputs to explicitly use `id` tied to `<label htmlFor="id">` or explicitly define `aria-label`s if visual labels are absent.
