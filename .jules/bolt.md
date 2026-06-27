## 2024-05-18 - Caching Backend Settings
**Learning:** The application calls `get_settings` multiple times per request (e.g., inside `public_menu` and `get_api_key`), resulting in redundant database queries.
**Action:** Implemented a caching mechanism in `settings_service.py` using `_cached_settings` and `_cache_time` variables to prevent querying the database repeatedly.
