import asyncio
import time
import threading
from uvicorn import Config, Server
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Create a dummy API server that takes 1 second to respond
dummy_app = FastAPI()

@dummy_app.post("/search")
async def dummy_search():
    await asyncio.sleep(0.5)
    return {"output": {"content": {"entities": ["a"], "faqs": ["b"], "gaps": ["c"]}}}

@dummy_app.post("/v1/chat/completions")
async def dummy_mistral():
    await asyncio.sleep(0.5)
    return {"choices": [{"message": {"content": "```json\n{\"test\": 1}\n```"}}]}

def run_dummy_server():
    config = Config(app=dummy_app, host="127.0.0.1", port=9999, log_level="critical")
    server = Server(config)
    server.run()

# Start dummy server in a thread
threading.Thread(target=run_dummy_server, daemon=True).start()
time.sleep(2) # wait for server to start

# Now import the router and test it. We'll need to patch the URLs and mock get_db.
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routers.seo_engine import router
from unittest.mock import patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

app = FastAPI()
app.include_router(router)

@app.get("/health")
def health(): return "ok"

# Mock the _keys function to avoid DB
async def mock_keys(db):
    return {"exa": "fake-exa", "mistral": "fake-mistral"}

# Start main app
def run_main_server():
    config = Config(app=app, host="127.0.0.1", port=9998, log_level="critical")
    server = Server(config)
    server.run()

threading.Thread(target=run_main_server, daemon=True).start()
time.sleep(2)

async def test_concurrent_requests():
    async with httpx.AsyncClient() as client:
        # Replace URLs temporarily
        with patch('routers.seo_engine.MISTRAL_URL', 'http://127.0.0.1:9999/v1/chat/completions'), \
             patch('routers.seo_engine._keys', side_effect=mock_keys):

            # Note: We can't patch requests.post URL directly easily if it's hardcoded, let's patch requests.post itself to call the local server.
            # Wait, MISTRAL_URL is a global variable. For exa, it's hardcoded to "https://api.exa.ai/search".
            pass

        # Actually, let's just patch requests.post in the seo_engine

        # Or better, just write a standalone script that imports _call_exa and patches requests.post to just do time.sleep(0.5)
