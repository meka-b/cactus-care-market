## 2026-06-27 - [CRITICAL] Remove Hardcoded Plant.id API Key
**Vulnerability:** A hardcoded API key for `plant.id` (`jsgUNceGWpmTJ3tt5DcuzDB01IklNVLk61VBqBXFAbrGjKIlw8`) was embedded directly into `backend/plant_id_service.py`. A scratchpad text file `backend/rag/api_key.txt` also contained plain text keys.
**Learning:** External API dependencies should never rely on hardcoded static strings in source code.
**Prevention:** Keys should be routed through `settings_service.get_api_key` and exposed safely to the Admin via `KEY_LABELS` in `frontend/src/pages/admin/AdminSettings.jsx`.
