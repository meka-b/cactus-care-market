import asyncio
import time
import requests
import httpx
from unittest.mock import patch, MagicMock

# Import the service
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import backend.ai_service as ai_service

class DummyDB:
    pass

async def dummy_keys(db):
    return {"plantnet": "dummy", "mistral": "dummy", "exa": "dummy"}

async def dummy_taxonomy(db):
    return {"categories": [], "care_levels": [], "light_needs": [], "water_needs": [], "sizes": []}

# Instead of calling the full analyze_plant_image which requires DB
# We will just benchmark `chat_with_yaver` or the identify / mistral directly.
# Let's benchmark analyze_plant_image by mocking get_taxonomy and _keys completely.
async def run_benchmark():
    # Patch ai_service dependencies
    ai_service._keys = dummy_keys

    import backend.settings_service as settings_service
    settings_service.get_taxonomy = dummy_taxonomy

    # We don't want it to reach real DB. Let's trace analyze_plant_image:
    # keys = await _keys(db) -> Mocked
    # from settings_service import get_taxonomy
    # taxonomy = await get_taxonomy(db) -> Mocked
    # plant = identify_with_plantnet_sync(image_bytes, keys["plantnet"])
    # ai = generate_taxonomy_with_mistral_sync(...)
    # It does not use db anywhere else!

    # Mock requests.post to simulate slow network call
    def mocked_post(*args, **kwargs):
        # Simulate network delay by blocking
        time.sleep(0.5)
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "results": [{"species": {"scientificNameWithoutAuthor": "Test", "commonNames": ["Test"], "genus": {"scientificNameWithoutAuthor": "Test"}, "family": {"scientificNameWithoutAuthor": "Test"}}, "score": 0.99}],
            "choices": [{"message": {"content": "{}"}}]
        }
        mock_response.raise_for_status.return_value = None
        return mock_response

    requests.post = mocked_post

    start = time.time()

    try:
        # Run 5 concurrent requests
        # Each request will call plantnet (0.5s) and mistral (0.5s) = 1s per request.
        # So 5 concurrent should take ~1s if async, or ~5s if sync blocking!
        tasks = [ai_service.analyze_plant_image(b"dummy", DummyDB()) for _ in range(5)]
        await asyncio.gather(*tasks)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        end = time.time()
        print(f"Time taken for 5 concurrent requests: {end - start:.2f} seconds")

asyncio.run(run_benchmark())
