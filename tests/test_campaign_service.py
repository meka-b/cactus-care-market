import sys
import os
import pytest
from datetime import datetime, timezone, timedelta

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from campaign_service import is_campaign_live

def test_is_campaign_live_not_active():
    assert not is_campaign_live({"is_active": False})

def test_is_campaign_live_no_dates():
    assert is_campaign_live({"is_active": True})
    assert is_campaign_live({})  # default is_active True

def test_is_campaign_live_future_start():
    now = datetime.now(timezone.utc)
    future = now + timedelta(days=1)
    assert not is_campaign_live({"start_at": future.isoformat()})

def test_is_campaign_live_past_start():
    now = datetime.now(timezone.utc)
    past = now - timedelta(days=1)
    assert is_campaign_live({"start_at": past.isoformat()})

def test_is_campaign_live_past_end():
    now = datetime.now(timezone.utc)
    past = now - timedelta(days=1)
    assert not is_campaign_live({"end_at": past.isoformat()})

def test_is_campaign_live_future_end():
    now = datetime.now(timezone.utc)
    future = now + timedelta(days=1)
    assert is_campaign_live({"end_at": future.isoformat()})

def test_is_campaign_live_within_range():
    now = datetime.now(timezone.utc)
    past = now - timedelta(days=1)
    future = now + timedelta(days=1)
    assert is_campaign_live({
        "start_at": past.isoformat(),
        "end_at": future.isoformat()
    })

def test_is_campaign_live_outside_range():
    now = datetime.now(timezone.utc)
    past1 = now - timedelta(days=2)
    past2 = now - timedelta(days=1)
    # ended already
    assert not is_campaign_live({
        "start_at": past1.isoformat(),
        "end_at": past2.isoformat()
    })

def test_is_campaign_live_with_z_suffix():
    now = datetime.now(timezone.utc)
    past = now - timedelta(days=1)
    future = now + timedelta(days=1)

    # create ISO string with Z suffix
    past_iso = past.isoformat()
    if "+00:00" in past_iso:
        past_iso = past_iso.replace("+00:00", "Z")
    else:
        past_iso += "Z"

    future_iso = future.isoformat()
    if "+00:00" in future_iso:
        future_iso = future_iso.replace("+00:00", "Z")
    else:
        future_iso += "Z"

    assert is_campaign_live({
        "start_at": past_iso,
        "end_at": future_iso
    })

def test_is_campaign_live_with_datetime_objects():
    now = datetime.now(timezone.utc)
    past = now - timedelta(days=1)
    future = now + timedelta(days=1)
    assert is_campaign_live({
        "start_at": past,
        "end_at": future
    })

def test_is_campaign_live_naive_datetime():
    now = datetime.now(timezone.utc)
    # create naive datetime by removing tzinfo
    past = (now - timedelta(days=1)).replace(tzinfo=None)
    future = (now + timedelta(days=1)).replace(tzinfo=None)

    assert is_campaign_live({
        "start_at": past.isoformat(),
        "end_at": future.isoformat()
    })

def test_is_campaign_live_invalid_date():
    # Should fall back to True (graceful degradation)
    assert is_campaign_live({"start_at": "invalid-date-format"})
