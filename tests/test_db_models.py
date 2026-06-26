import pytest
from datetime import datetime, timezone
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from db_models import now_utc

def test_now_utc_returns_datetime():
    result = now_utc()
    assert isinstance(result, datetime)

def test_now_utc_is_timezone_aware():
    result = now_utc()
    assert result.tzinfo == timezone.utc

def test_now_utc_time_range():
    before = datetime.now(timezone.utc)
    result = now_utc()
    after = datetime.now(timezone.utc)

    assert before <= result <= after
