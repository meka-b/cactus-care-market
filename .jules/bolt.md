## 2026-07-18 - Use Async httpx
**Learning:** When making HTTP requests within an asyncio context, using `requests` will block the event loop. Use `httpx.AsyncClient` to ensure non-blocking concurrent performance.
**Action:** Always prefer `httpx` for external requests in FastAPI routes.
