"""İyzico sandbox payment integration. Reads keys from DB settings with ENV fallback."""
import os
import logging
import iyzipay
import json as _json
from settings_service import get_api_key

logger = logging.getLogger(__name__)


async def _iyzico_options(db):
    base_url = os.environ.get("IYZICO_BASE_URL", "sandbox-api.iyzipay.com")
    if base_url.startswith("https://"):
        base_url = base_url.replace("https://", "")
    if base_url.startswith("http://"):
        base_url = base_url.replace("http://", "")
        
    return {
        "api_key": (await get_api_key(db, "iyzico_api")) or os.environ.get("IYZICO_API_KEY", ""),
        "secret_key": (await get_api_key(db, "iyzico_secret")) or os.environ.get("IYZICO_SECRET", ""),
        "base_url": base_url,
    }


async def create_checkout_form(db, order: dict, callback_url: str) -> dict:
    options = await _iyzico_options(db)
    if not options["api_key"]:
        return {"status": "failure", "errorMessage": "İyzico API anahtarı tanımlı değil"}
    addr = order["address"]
    items = order["items"]
    buyer = {
        "id": order.get("user_id") or order["id"],
        "name": addr["full_name"].split(" ")[0] if " " in addr["full_name"] else addr["full_name"],
        "surname": addr["full_name"].split(" ", 1)[1] if " " in addr["full_name"] else "-",
        "gsmNumber": addr.get("phone", "+905555555555"),
        "email": order["email"],
        "identityNumber": "11111111111",
        "registrationAddress": addr["address_line"],
        "ip": "85.34.78.112",
        "city": addr["city"],
        "country": "Turkey",
        "zipCode": addr.get("zip_code", "34000"),
    }
    shipping = {
        "contactName": addr["full_name"],
        "city": addr["city"],
        "country": "Turkey",
        "address": addr["address_line"],
        "zipCode": addr.get("zip_code", "34000"),
    }
    basket = [
        {
            "id": it["product_id"],
            "name": it["name"][:100],
            "category1": "Bitki",
            "itemType": "PHYSICAL",
            "price": f"{it['price'] * it['quantity']:.2f}",
        }
        for it in items
    ]
    payload = {
        "locale": "tr",
        "conversationId": order["id"],
        "price": f"{order['subtotal']:.2f}",
        "paidPrice": f"{order['total']:.2f}",
        "currency": "TRY",
        "basketId": order["id"],
        "paymentGroup": "PRODUCT",
        "callbackUrl": callback_url,
        "enabledInstallments": [2, 3, 6, 9],
        "buyer": buyer,
        "shippingAddress": shipping,
        "billingAddress": shipping,
        "basketItems": basket,
    }
    try:
        result = iyzipay.CheckoutFormInitialize().create(payload, options)
        raw = result.read().decode("utf-8")
        data = _json.loads(raw)
        logger.info(f"Iyzico create result status={data.get('status')}")
        return data
    except Exception as e:
        logger.error(f"Iyzico error: {e}")
        return {"status": "failure", "errorMessage": str(e)}


async def retrieve_checkout_result(db, token: str) -> dict:
    options = await _iyzico_options(db)
    try:
        result = iyzipay.CheckoutForm().retrieve({"locale": "tr", "token": token}, options)
        raw = result.read().decode("utf-8")
        return _json.loads(raw)
    except Exception as e:
        logger.error(f"Iyzico retrieve error: {e}")
        return {"status": "failure", "errorMessage": str(e)}
