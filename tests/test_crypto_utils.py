import pytest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from crypto_utils import encrypt_value, decrypt_value

def test_encrypt_decrypt_valid_string():
    original_string = "my_super_secret_value"
    encrypted = encrypt_value(original_string)

    assert encrypted != original_string
    assert type(encrypted) is str

    decrypted = decrypt_value(encrypted)
    assert decrypted == original_string

def test_encrypt_empty_string():
    assert encrypt_value("") == ""
    assert encrypt_value(None) is None

def test_decrypt_empty_string():
    assert decrypt_value("") == ""
    assert decrypt_value(None) is None

def test_decrypt_invalid_string():
    # If the token is invalid, it should return the original string
    invalid_encrypted_string = "this_is_not_a_valid_fernet_token"
    assert decrypt_value(invalid_encrypted_string) == invalid_encrypted_string
