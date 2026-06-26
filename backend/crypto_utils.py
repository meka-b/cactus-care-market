import os
import base64
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

def get_encryption_key() -> bytes:
    env_key = os.environ.get("ENCRYPTION_KEY")
    if env_key:
        try:
            # Check if it's already a valid fernet key
            Fernet(env_key.encode())
            return env_key.encode()
        except ValueError:
            pass

    secret = os.environ.get("JWT_SECRET", "dev-secret")
    salt = b"yesil_dukkan_api_key_salt"

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
    return key

_fernet = Fernet(get_encryption_key())

def encrypt_value(value: str) -> str:
    if not value:
        return value
    return _fernet.encrypt(value.encode('utf-8')).decode('utf-8')

def decrypt_value(value: str) -> str:
    if not value:
        return value
    try:
        return _fernet.decrypt(value.encode('utf-8')).decode('utf-8')
    except (InvalidToken, TypeError, ValueError):
        # Fallback to plain text if the value is not encrypted
        return value
