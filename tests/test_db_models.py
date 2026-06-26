import uuid
import sys
import os

# Add the backend directory to sys.path so we can import from db_models directly
# if the test is run from the root.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from db_models import generate_uuid

def test_generate_uuid_returns_string():
    """Test that generate_uuid returns a string."""
    result = generate_uuid()
    assert isinstance(result, str), f"Expected string, got {type(result)}"

def test_generate_uuid_valid_format():
    """Test that the returned string is a valid UUID."""
    result = generate_uuid()
    # If the UUID is invalid, uuid.UUID will raise a ValueError
    try:
        parsed_uuid = uuid.UUID(result)
        # Ensure it's a UUID4
        assert parsed_uuid.version == 4, f"Expected UUID version 4, got {parsed_uuid.version}"
    except ValueError as e:
        assert False, f"generate_uuid returned invalid UUID string: {result}, error: {e}"

def test_generate_uuid_uniqueness():
    """Test that consecutive calls generate different UUIDs."""
    uuid1 = generate_uuid()
    uuid2 = generate_uuid()
    assert uuid1 != uuid2, "Consecutive calls to generate_uuid returned the same value"
