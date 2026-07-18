## 2025-02-04 - Hardcoded JWT Secret Vulnerability

**Learning:** When removing a hardcoded secret fallback, verify all usages of that fallback. For `JWT_SECRET`, ensure there are no default values like `os.environ.get("JWT_SECRET", "dev-secret")` in *any* module (e.g., both `auth.py` and `crypto_utils.py`), as this allows the application to start with a known, insecure secret. Additionally, ensure security-focused PRs do not include unrelated test refactoring that pollutes the commit history.
**Action:** Always search the codebase (using `grep`) for the default fallback string (e.g., `"dev-secret"`) and related configuration keys (`"JWT_SECRET"`) to ensure all instances are identified before committing a fix. Avoid committing extraneous modifications to unrelated files.
