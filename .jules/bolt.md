## 2023-10-27 - [Async IO Performance Optimization]
**Learning:** Using `requests` in an `async def` function inherently blocks the entire event loop until the request finishes, transforming asynchronous potential into sequential execution.
**Action:** Replace `requests` with an asynchronous alternative such as `httpx.AsyncClient` inside `async with` blocks to properly yield control back to the event loop, effectively optimizing concurrent IO-bound execution.
