## 2024-08-07 - Fix Overly Permissive CORS Configuration

**Learning:** The default value for `CORS_ORIGINS` in `server.py` was set to `"*"` which could lead to an overly permissive CORS configuration. Although `allow_credentials` is disabled when a wildcard is present, allowing arbitrary origins by default is not a safe practice.
**Action:** Always provide a restrictive default for environment variables controlling security settings. In this case, `""` (empty string) acts as a fail-close default, ensuring that explicitly trusted origins must be configured to allow cross-origin access.
