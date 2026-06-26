import os
import pytest
import importlib


def test_auth_requires_jwt_secret(monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    with pytest.raises(KeyError) as exc_info:
        import auth

        importlib.reload(auth)
    assert "JWT_SECRET" in str(exc_info.value)


def test_auth_success_with_jwt_secret(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    import auth

    importlib.reload(auth)
    assert auth.JWT_SECRET == "test-secret"
