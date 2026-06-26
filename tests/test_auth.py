import pytest
import sys
import os

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.auth import hash_password, verify_password

def test_verify_password_success():
    password = "MySecurePassword123!"
    hashed = hash_password(password)
    assert verify_password(password, hashed) is True

def test_verify_password_mismatch():
    password = "MySecurePassword123!"
    hashed = hash_password(password)
    assert verify_password("WrongPassword123!", hashed) is False

def test_verify_password_invalid_hash():
    # bcrypt checks for correct hash format and will raise an exception if invalid
    assert verify_password("MySecurePassword123!", "invalid_hash_string") is False
