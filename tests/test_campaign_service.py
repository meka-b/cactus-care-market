import sys
import os
import pytest
from datetime import datetime, timezone, timedelta

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from campaign_service import is_campaign_live, calculate_bundle

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

# --- calculate_bundle edge cases ---

def test_calculate_bundle_not_live():
    # is_active: False -> not live
    camp = {"is_active": False}
    result = calculate_bundle(camp, [])
    assert not result["valid"]
    assert result["reason"] == "Kampanya aktif değil veya tarihi geçti."
    assert result["discount"] == 0

def test_calculate_bundle_unknown_type():
    camp = {"is_active": True, "type": "unknown_type"}
    result = calculate_bundle(camp, [])
    assert not result["valid"]
    assert result["reason"] == "Bilinmeyen kampanya tipi."

def test_calculate_bundle_fixed_bundle_happy_path():
    camp = {
        "is_active": True,
        "type": "fixed_bundle",
        "primary_product_id": "p1",
        "related_product_ids": ["p2", "p3"],
        "bundle_price": 80.0
    }
    items = [
        {"id": "p1", "price": 50, "quantity": 1},
        {"id": "p2", "price": 40, "quantity": 1}
    ]
    result = calculate_bundle(camp, items)
    assert result["valid"]
    assert result["subtotal"] == 90.0
    assert result["discount"] == 10.0
    assert result["bundle_total"] == 80.0

def test_calculate_bundle_fixed_bundle_missing_primary():
    camp = {
        "is_active": True,
        "type": "fixed_bundle",
        "primary_product_id": "p1",
        "related_product_ids": ["p2", "p3"],
        "bundle_price": 80.0
    }
    items = [
        {"id": "p2", "price": 40, "quantity": 1},
        {"id": "p3", "price": 30, "quantity": 1}
    ]
    result = calculate_bundle(camp, items)
    assert not result["valid"]
    assert result["reason"] == "Birlikte alım için en az ana ürün + 1 ek ürün seçili olmalı."

def test_calculate_bundle_fixed_bundle_missing_related():
    camp = {
        "is_active": True,
        "type": "fixed_bundle",
        "primary_product_id": "p1",
        "related_product_ids": ["p2", "p3"],
        "bundle_price": 80.0
    }
    items = [
        {"id": "p1", "price": 50, "quantity": 1}
    ]
    result = calculate_bundle(camp, items)
    assert not result["valid"]
    assert result["reason"] == "Birlikte alım için en az ana ürün + 1 ek ürün seçili olmalı."

def test_calculate_bundle_fixed_bundle_outside_product():
    camp = {
        "is_active": True,
        "type": "fixed_bundle",
        "primary_product_id": "p1",
        "related_product_ids": ["p2"],
        "bundle_price": 80.0
    }
    items = [
        {"id": "p1", "price": 50, "quantity": 1},
        {"id": "p2", "price": 40, "quantity": 1},
        {"id": "p3", "price": 30, "quantity": 1}  # outside product
    ]
    result = calculate_bundle(camp, items)
    assert not result["valid"]
    assert result["reason"] == "Kampanya dışı ürün seçildi."

def test_calculate_bundle_fixed_bundle_target_greater_than_subtotal():
    camp = {
        "is_active": True,
        "type": "fixed_bundle",
        "primary_product_id": "p1",
        "related_product_ids": ["p2"],
        "bundle_price": 100.0  # target > subtotal (90)
    }
    items = [
        {"id": "p1", "price": 50, "quantity": 1},
        {"id": "p2", "price": 40, "quantity": 1}
    ]
    result = calculate_bundle(camp, items)
    assert result["valid"]
    assert result["discount"] == 0  # discount should not be negative
    assert result["bundle_total"] == 90.0

def test_calculate_bundle_percentage_bundle_happy_path():
    camp = {
        "is_active": True,
        "type": "percentage_bundle",
        "primary_product_id": "p1",
        "discount_pct": 20.0
    }
    items = [
        {"id": "p1", "price": 50, "quantity": 1},
        {"id": "p2", "price": 50, "quantity": 1}
    ]
    result = calculate_bundle(camp, items)
    assert result["valid"]
    assert result["subtotal"] == 100.0
    assert result["discount"] == 20.0
    assert result["bundle_total"] == 80.0

def test_calculate_bundle_percentage_bundle_missing_required():
    camp = {
        "is_active": True,
        "type": "percentage_bundle",
        "primary_product_id": "p1",
        "discount_pct": 20.0
    }
    items = [
        {"id": "p2", "price": 50, "quantity": 1}
    ]
    result = calculate_bundle(camp, items)
    assert not result["valid"]
    assert result["reason"] == "En az ana ürün + 1 ek ürün seçili olmalı."

def test_calculate_bundle_fixed_amount_bundle_happy_path():
    camp = {
        "is_active": True,
        "type": "fixed_amount_bundle",
        "primary_product_id": "p1",
        "discount_amount": 15.0
    }
    items = [
        {"id": "p1", "price": 50, "quantity": 1},
        {"id": "p2", "price": 30, "quantity": 1}
    ]
    result = calculate_bundle(camp, items)
    assert result["valid"]
    assert result["subtotal"] == 80.0
    assert result["discount"] == 15.0
    assert result["bundle_total"] == 65.0

def test_calculate_bundle_fixed_amount_bundle_missing_required():
    camp = {
        "is_active": True,
        "type": "fixed_amount_bundle",
        "primary_product_id": "p1",
        "discount_amount": 15.0
    }
    items = [
        {"id": "p1", "price": 50, "quantity": 1}
    ]
    result = calculate_bundle(camp, items)
    assert not result["valid"]
    assert result["reason"] == "En az ana ürün + 1 ek ürün seçili olmalı."

def test_calculate_bundle_fixed_amount_bundle_amount_greater_than_subtotal():
    camp = {
        "is_active": True,
        "type": "fixed_amount_bundle",
        "primary_product_id": "p1",
        "discount_amount": 100.0
    }
    items = [
        {"id": "p1", "price": 50, "quantity": 1},
        {"id": "p2", "price": 30, "quantity": 1}
    ]
    result = calculate_bundle(camp, items)
    assert result["valid"]
    assert result["subtotal"] == 80.0
    assert result["discount"] == 80.0  # discount should not exceed subtotal
    assert result["bundle_total"] == 0.0

def test_calculate_bundle_buy_x_get_y_happy_path():
    camp = {
        "is_active": True,
        "type": "buy_x_get_y",
        "primary_product_id": "p1",
        "free_product_id": "p2",
        "free_qty": 2
    }
    items = [
        {"id": "p1", "price": 100, "quantity": 1},
        {"id": "p2", "price": 20, "quantity": 3}
    ]
    result = calculate_bundle(camp, items)
    assert result["valid"]
    assert result["subtotal"] == 160.0
    assert result["discount"] == 40.0  # min(2, 3) * 20
    assert result["bundle_total"] == 120.0

def test_calculate_bundle_buy_x_get_y_missing_products():
    camp = {
        "is_active": True,
        "type": "buy_x_get_y",
        "primary_product_id": "p1",
        "free_product_id": "p2",
        "free_qty": 1
    }
    # missing free product
    items1 = [
        {"id": "p1", "price": 100, "quantity": 1}
    ]
    result1 = calculate_bundle(camp, items1)
    assert not result1["valid"]
    assert result1["reason"] == "X+Y kampanyası için ana ürün ve ücretsiz ürün her ikisi de seçili olmalı."

    # missing primary product
    items2 = [
        {"id": "p2", "price": 20, "quantity": 1}
    ]
    result2 = calculate_bundle(camp, items2)
    assert not result2["valid"]
    assert result2["reason"] == "X+Y kampanyası için ana ürün ve ücretsiz ürün her ikisi de seçili olmalı."

def test_calculate_bundle_quantity_break_happy_path():
    camp = {
        "is_active": True,
        "type": "quantity_break",
        "primary_product_id": "p1",
        "quantity_tiers": [
            {"min_qty": 2, "discount_pct": 10},
            {"min_qty": 5, "discount_pct": 20}
        ]
    }
    # exactly 2 -> 10%
    items1 = [
        {"id": "p1", "price": 50, "quantity": 2},
        {"id": "p2", "price": 30, "quantity": 1}
    ]
    result1 = calculate_bundle(camp, items1)
    assert result1["valid"]
    assert result1["discount"] == 10.0  # 10% of 100 (primary only)
    assert result1["bundle_total"] == 120.0

    # exactly 5 -> 20%
    items2 = [
        {"id": "p1", "price": 50, "quantity": 5},
    ]
    result2 = calculate_bundle(camp, items2)
    assert result2["valid"]
    assert result2["discount"] == 50.0  # 20% of 250 (primary only)
    assert result2["bundle_total"] == 200.0

def test_calculate_bundle_quantity_break_missing_primary():
    camp = {
        "is_active": True,
        "type": "quantity_break",
        "primary_product_id": "p1",
        "quantity_tiers": [
            {"min_qty": 2, "discount_pct": 10}
        ]
    }
    items = [
        {"id": "p2", "price": 30, "quantity": 2}
    ]
    result = calculate_bundle(camp, items)
    assert not result["valid"]
    assert result["reason"] == "Ana ürün seçilmedi."

def test_calculate_bundle_quantity_break_insufficient_quantity():
    camp = {
        "is_active": True,
        "type": "quantity_break",
        "primary_product_id": "p1",
        "quantity_tiers": [
            {"min_qty": 2, "discount_pct": 10}
        ]
    }
    items = [
        {"id": "p1", "price": 50, "quantity": 1}
    ]
    result = calculate_bundle(camp, items)
    assert not result["valid"]
    assert result["reason"] == "Bu miktarda indirim kademesi yok."
