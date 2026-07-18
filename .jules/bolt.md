## 2024-07-18 - Replacing blocking requests with httpx
**Learning:** Using synchronous `requests.post` inside FastAPI async routes/handlers blocks the asyncio event loop and severely degrades concurrency.
**Action:** Always prefer `async with httpx.AsyncClient() as client: await client.post(...)` within async functions to allow concurrent execution and better scaling.
