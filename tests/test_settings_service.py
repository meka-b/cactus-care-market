import pytest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
import settings_service

def test_clear_cache():
    # Set dummy values
    settings_service._cached_settings = {"some": "data"}
    settings_service._cache_time = 1234567890

    # Call the function to clear the cache
    settings_service.clear_cache()

    # Assert that variables were reset to expected values
    assert settings_service._cached_settings is None
    assert settings_service._cache_time == 0
