import asyncio
import time
from unittest.mock import patch, MagicMock

# Create a mock db object
class MockDB:
    pass

# Mock the requests functions directly
async def run_benchmark():
    from routers.seo_engine import _call_mistral_json, _call_mistral, _call_exa

    async def mock_keys(db):
        return {"exa": "fake_key", "mistral": "fake_key"}

    # Mock httpx.AsyncClient().post to simulate network delay
    class MockClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            pass

        async def post(self, *args, **kwargs):
            await asyncio.sleep(0.5) # Simulate a 500ms network delay asynchronously
            mock_resp = MagicMock()
            mock_resp.json.return_value = {
                "output": {"content": {"entities": [], "faqs": [], "gaps": []}},
                "choices": [{"message": {"content": "```json\n{}\n```"}}]
            }
            return mock_resp

    def mock_async_client(*args, **kwargs):
        return MockClient()

    with patch('routers.seo_engine._keys', new=mock_keys):
        with patch('httpx.AsyncClient', side_effect=mock_async_client):
            start = time.time()
            db = MockDB()
            # Call concurrently
            await asyncio.gather(
                _call_mistral_json("test1", db),
                _call_mistral_json("test2", db),
                _call_mistral_json("test3", db),
                _call_mistral("test4", db),
                _call_exa("test5", db)
            )
            elapsed = time.time() - start
            print(f"Time taken (optimized): {elapsed:.2f} seconds")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
