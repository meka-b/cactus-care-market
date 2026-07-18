import asyncio
import time
import sys
import os
from unittest.mock import patch
import httpx

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Provide a mock async client instead of requests
class MockAsyncResponse:
    def __init__(self, json_data, status_code):
        self.json_data = json_data
        self.status_code = status_code

    def json(self):
        return self.json_data

    def raise_for_status(self):
        pass

async def mock_httpx_post(*args, **kwargs):
    await asyncio.sleep(0.5) # Simulate network latency
    if "api.exa.ai" in args[0] or "api.exa.ai" == args[0]:
        return MockAsyncResponse({"output": {"content": {"entities": ["a"], "faqs": ["b"], "gaps": ["c"]}}}, 200)
    else:
        return MockAsyncResponse({"choices": [{"message": {"content": "```json\n{\"test\": 1}\n```"}}]}, 200)

async def mock_keys(*args, **kwargs):
    return {"exa": "fake-exa", "mistral": "fake-mistral"}

# Copy of the optimized code to benchmark it locally
async def optimized_call_exa(query: str, db) -> dict:
    keys = await mock_keys(db)
    exa_key = keys.get("exa")

    headers = {
        "x-api-key": exa_key,
        "Content-Type": "application/json"
    }

    schema = {
        "type": "object",
        "description": "Semantic SEO analysis of the topic",
        "required": ["entities", "faqs", "gaps"],
        "properties": {
            "entities": {"type": "array", "items": {"type": "string"}},
            "faqs": {"type": "array", "items": {"type": "string"}},
            "gaps": {"type": "array", "items": {"type": "string"}}
        }
    }

    payload = {
        "query": f"best comprehensive articles and guides about {query}",
        "type": "deep",
        "systemPrompt": "Analyze the top search results to extract key SEO entities, frequently asked questions, and content gaps. Output valid JSON adhering to the provided schema.",
        "outputSchema": schema,
        "contents": {
            "highlights": True
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post("https://api.exa.ai/search", json=payload, headers=headers, timeout=30)
            r.raise_for_status()
            data = r.json()
            return data.get("output", {}).get("content", {"entities": [], "faqs": [], "gaps": []})
    except Exception as e:
        raise Exception(str(e))

async def run_optimized():
    with patch('httpx.AsyncClient.post', side_effect=mock_httpx_post):
        start_time = time.time()

        # Run 5 concurrent calls
        tasks = [optimized_call_exa("test", None) for _i in range(5)]
        await asyncio.gather(*tasks)

        end_time = time.time()
        duration = end_time - start_time
        print(f"Optimized Time taken for 5 concurrent calls: {duration:.2f} seconds")
        return duration

if __name__ == "__main__":
    asyncio.run(run_optimized())
