## 2024-07-18 - Replacing requests with httpx in Async Contexts
**Learning:** `requests.post` inside an async endpoint blocks the event loop. In FastAPI, `requests` forces concurrent calls (e.g. `asyncio.gather`) to resolve sequentially. By using `httpx.AsyncClient().post` inside an `async with` block, the tasks execute concurrently, drastically cutting execution time.
**Action:** Always verify third-party HTTP clients in async functions support asynchronous operation (e.g., `httpx`, `aiohttp`) rather than using synchronous libraries like `requests`.
