import os
import pytest
import importlib

def test_crypto_requires_jwt_secret(monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
    with pytest.raises(KeyError) as exc_info:
        import crypto_utils
        importlib.reload(crypto_utils)
    assert "JWT_SECRET" in str(exc_info.value)

def test_crypto_success_with_jwt_secret(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
    import crypto_utils
    importlib.reload(crypto_utils)
    assert crypto_utils._fernet is not None
