## $(date +%Y-%m-%d) - Secure JWT Generation
**Learning:** Generating JWTs without a `jti` (JWT ID) claim makes identically created tokens exact duplicates, which can be vulnerable to replay attacks or lack tracking.
**Action:** Always include `"jti": secrets.token_hex(16)` when generating JWT payloads to ensure each token has a cryptographically secure, unique identifier.
