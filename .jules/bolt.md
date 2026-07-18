## 2025-02-18 - Optimize RAG Service Embeddings Async
**Learning:** Synchronous network calls (like `requests.post`) inside asynchronous functions (using `async`/`await`) block the event loop, severely degrading performance.
**Action:** Replace blocking synchronous calls with asynchronous alternatives like `httpx.AsyncClient` paired with `await` to maintain high concurrency. For long term scalability, a global instance of `httpx.AsyncClient()` should ideally be used for connection pooling.
