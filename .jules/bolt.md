## 2024-06-25 - Use httpx in async endpoints instead of requests
**Learning:** In Python asynchronous frameworks like FastAPI or aiohttp, using synchronous blocking calls such as `requests.post()` halts the event loop, causing concurrency issues and significant performance degradation.
**Action:** Always employ an asynchronous client like `httpx.AsyncClient()` and use `await client.post()` for network requests within an `async def` function to maximize concurrency.
