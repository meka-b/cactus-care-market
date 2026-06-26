import pytest
from datetime import datetime, timezone, timedelta
from jose import jwt

# Adjust python path if necessary to import backend
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.auth import create_token, JWT_SECRET, JWT_ALG, JWT_EXPIRE_DAYS


def test_create_token_default_role():
    """Test creating a token with the default customer role."""
    user_id = "test_user_123"
    token = create_token(user_id)

    # Assert token is a string
    assert isinstance(token, str)
    assert len(token) > 0

    # Decode the token
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])

    # Assert claims are correct
    assert payload["sub"] == user_id
    assert payload["role"] == "customer"

    # Assert expiration is in the future
    exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    assert exp_time > datetime.now(timezone.utc)

    # Assert expiration is approximately correct (+- 1 minute)
    expected_exp_time = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    time_diff = abs((exp_time - expected_exp_time).total_seconds())
    assert time_diff < 60  # less than a minute difference


def test_create_token_custom_role():
    """Test creating a token with a custom role (e.g., admin)."""
    user_id = "admin_user_456"
    role = "admin"
    token = create_token(user_id, role)

    # Decode the token
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])

    # Assert claims are correct
    assert payload["sub"] == user_id
    assert payload["role"] == role
