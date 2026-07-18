import asyncio
import time
from unittest.mock import patch, MagicMock

async def test_performance():
    import backend.rag_service as rs
    import httpx

    class MockDb:
        pass

    async def mock_keys(db):
        return {"mistral": "fake_key"}

    rs._keys = mock_keys

    # mock httpx post
    async def mock_httpx_post(*args, **kwargs):
        await asyncio.sleep(0.1) # 100ms latency
        m = MagicMock()
        m.raise_for_status = MagicMock()
        m.json.return_value = {"data": [{"embedding": [0.1]}]}
        return m

    # Mock the new implementation we'll add
    class AsyncClientMock:
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def post(self, *args, **kwargs):
            return await mock_httpx_post(*args, **kwargs)

    with patch("httpx.AsyncClient", return_value=AsyncClientMock()):
        start = time.time()
        await asyncio.gather(*[rs.get_embedding("test", MockDb()) for _ in range(10)])
        async_time = time.time() - start
        print(f"httpx.AsyncClient time (10 concurrent requests): {async_time:.4f}s")

asyncio.run(test_performance())
