import pytest
from unittest.mock import patch, MagicMock

import sys
import os

# Add backend to sys.path according to memory guidelines
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

import payment_service

@pytest.mark.asyncio
async def test_create_checkout_form_missing_api_key():
    db_mock = MagicMock()
    with patch('payment_service._iyzico_options', return_value={"api_key": ""}):
        result = await payment_service.create_checkout_form(db_mock, {}, "http://callback")
        assert result == {"status": "failure", "errorMessage": "İyzico API anahtarı tanımlı değil"}

@pytest.mark.asyncio
async def test_create_checkout_form_iyzipay_error():
    db_mock = MagicMock()
    order = {
        "id": "order-123",
        "email": "test@test.com",
        "subtotal": 100.0,
        "total": 100.0,
        "address": {
            "full_name": "John Doe",
            "phone": "+905555555555",
            "city": "Istanbul",
            "address_line": "Some street",
            "zip_code": "34000"
        },
        "items": [
            {
                "product_id": "p-1",
                "name": "Test Plant",
                "price": 100.0,
                "quantity": 1
            }
        ]
    }

    with patch('payment_service._iyzico_options', return_value={"api_key": "test_key", "secret_key": "test_secret", "base_url": "test_url"}):
        with patch('payment_service.iyzipay.CheckoutFormInitialize') as mock_iyzipay:
            mock_create = MagicMock()
            mock_create.create.side_effect = Exception("Iyzico connection error")
            mock_iyzipay.return_value = mock_create

            result = await payment_service.create_checkout_form(db_mock, order, "http://callback")
            assert result == {"status": "failure", "errorMessage": "Iyzico connection error"}
