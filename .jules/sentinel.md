## 2024-05-18 - Fix XSS in YaverChat
**Learning:** React `dangerouslySetInnerHTML` must be protected with DOMPurify if rendering any user input or unsanitized AI output.
**Action:** Always import and use `DOMPurify.sanitize(html)` before setting inner HTML in React components.
