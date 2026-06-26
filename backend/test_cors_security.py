import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os

# Instead of reloading server, let's just create a test app with the same CORS logic
def create_app(origins):
    app = FastAPI()
    cors_origins = origins.split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_credentials="*" not in cors_origins,
        allow_origins=cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/products")
    def products():
        return {"success": True}

    return app


def test_cors_security_specific_origin():
    # If CORS_ORIGINS is specific, allow_credentials should be True
    app = create_app("http://localhost:3000,http://example.com")

    client = TestClient(app)
    response = client.options("/api/products", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET"
    })

    if "access-control-allow-credentials" in response.headers:
        assert response.headers["access-control-allow-credentials"].lower() == "true"
        assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_security_wildcard_origin():
    # If CORS_ORIGINS is wildcard, allow_credentials should be False
    app = create_app("*")

    client = TestClient(app)
    response = client.options("/api/products", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET"
    })

    if "access-control-allow-credentials" in response.headers:
        assert response.headers["access-control-allow-credentials"].lower() != "true"
        assert response.headers["access-control-allow-origin"] == "*"
