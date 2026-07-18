import asyncio
import time
import sys
import os
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routers.seo_engine import _call_exa, _call_mistral, _call_mistral_json

class MockResponse:
    def __init__(self, json_data, status_code):
        self.json_data = json_data
        self.status_code = status_code

    def json(self):
        return self.json_data

    def raise_for_status(self):
        pass

def mock_requests_post(*args, **kwargs):
    time.sleep(0.5) # Simulate network latency
    if "api.exa.ai" in args[0] or "api.exa.ai" == args[0]:
        return MockResponse({"output": {"content": {"entities": ["a"], "faqs": ["b"], "gaps": ["c"]}}}, 200)
    else:
        return MockResponse({"choices": [{"message": {"content": "```json\n{\"test\": 1}\n```"}}]}, 200)

async def mock_keys(*args, **kwargs):
    return {"exa": "fake-exa", "mistral": "fake-mistral"}

async def run_baseline():
    with patch('routers.seo_engine.requests.post', side_effect=mock_requests_post), \
         patch('routers.seo_engine._keys', side_effect=mock_keys):

        start_time = time.time()

        # Run 5 concurrent calls
        tasks = [_call_exa("test", None) for _i in range(5)]
        await asyncio.gather(*tasks)

        end_time = time.time()
        duration = end_time - start_time
        print(f"Baseline Time taken for 5 concurrent calls: {duration:.2f} seconds")
        return duration

if __name__ == "__main__":
    asyncio.run(run_baseline())
