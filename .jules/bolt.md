## 2024-07-18 - Replacing synchronous HTTP calls in async context
**Learning:** Making synchronous HTTP requests (like `requests.post`) inside an async function blocks the event loop, causing severe performance degradation for concurrent requests.
**Action:** Always use an asynchronous HTTP client (like `httpx.AsyncClient`) inside `async` endpoints. For optimal connection pooling, initialize a single client at application startup and reuse it, though creating one per request via `async with` is still vastly superior to blocking the loop.
