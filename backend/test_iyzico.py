import iyzipay

options = {
    "api_key": "dummy",
    "secret_key": "dummy",
    "base_url": "https://sandbox-api.iyzipay.com"
}
try:
    iyzipay.CheckoutFormInitialize().create({"price": "1"}, options)
except Exception as e:
    print("Error with https:// :", repr(e))

options2 = {
    "api_key": "dummy",
    "secret_key": "dummy",
    "base_url": "sandbox-api.iyzipay.com"
}
try:
    iyzipay.CheckoutFormInitialize().create({"price": "1"}, options2)
except Exception as e:
    print("Error without https:// :", repr(e))
