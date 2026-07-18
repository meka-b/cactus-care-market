## 2024-05-24 - Replace requests with httpx in asynchronous Python code
**Learning:** Using the synchronous `requests` library inside asyncio routines severely blocks the event loop, decreasing application concurrency.
**Action:** Always refactor blocking `requests.post()` and `requests.get()` calls to utilize asynchronous clients like `httpx.AsyncClient` inside `async def` scopes. Note that connection pooling could further be improved by instantiating the HTTP client globally, but isolating it inside a context block is an acceptable immediate fix.
