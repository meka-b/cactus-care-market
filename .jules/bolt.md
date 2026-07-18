## 2024-05-18 - Replacing requests with httpx in Async Contexts
**Learning:** Using synchronous I/O operations like `requests.post` inside asynchronous functions blocks the asyncio event loop, causing severe performance bottlenecks under concurrent load.
**Action:** Always utilize an asynchronous HTTP client like `httpx.AsyncClient` when making network requests from within an `async def` function to prevent blocking the event loop and ensure scalability.
