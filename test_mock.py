import asyncio
import time
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

# Instead of patching settings_service.get_taxonomy, we patch ai_service.get_taxonomy
async def run_benchmark():
    ai_service._keys = dummy_keys

    # In ai_service.py: `from settings_service import get_taxonomy`. We need to intercept this import or patch the actual module where it comes from
    import backend.settings_service

    with patch('backend.ai_service.get_taxonomy', new=dummy_taxonomy, create=True):
        with patch('backend.settings_service.get_taxonomy', new=dummy_taxonomy):
            with patch('backend.ai_service.requests.post') as mock_post:
                def side_effect(*args, **kwargs):
                    time.sleep(0.5)
                    mock_response = MagicMock()
                    mock_response.json.return_value = {
                        "results": [{"species": {"scientificNameWithoutAuthor": "Test", "commonNames": ["Test"], "genus": {"scientificNameWithoutAuthor": "Test"}, "family": {"scientificNameWithoutAuthor": "Test"}}, "score": 0.99}],
                        "choices": [{"message": {"content": "{}"}}]
                    }
                    mock_response.raise_for_status.return_value = None
                    return mock_response

                mock_post.side_effect = side_effect

                # Mock identify_with_plantnet_sync and generate_taxonomy_with_mistral_sync to be async. Wait, they are sync functions!
                # Yes! The bug is that they are sync functions blocking the event loop.
                # Since analyze_plant_image is async, and calls sync functions identify_with_plantnet_sync and generate_taxonomy_with_mistral_sync,
                # we are benchmarking exactly this blocking behavior.

                start = time.time()
                tasks = [ai_service.analyze_plant_image(b"dummy", DummyDB()) for _ in range(5)]
                await asyncio.gather(*tasks)
                end = time.time()

                print(f"Baseline (blocking requests.post) Time taken for 5 concurrent requests: {end - start:.2f} seconds")

asyncio.run(run_benchmark())
