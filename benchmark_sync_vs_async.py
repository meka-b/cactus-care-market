import asyncio
import time
import requests
import httpx
from fastapi import FastAPI
import uvicorn
import threading

app = FastAPI()

@app.post("/mock")
async def mock_endpoint():
    await asyncio.sleep(0.5)
    return {"status": "ok"}

def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8080, log_level="critical")

# Start mock server in background thread
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(2) # wait for server to start

async def sync_call():
    # In a real async route, requests.post blocks the loop
    r = requests.post("http://127.0.0.1:8080/mock", json={}, timeout=2)
    return r.json()

async def async_call():
    async with httpx.AsyncClient() as client:
        r = await client.post("http://127.0.0.1:8080/mock", json={}, timeout=2)
        return r.json()

async def main():
    print("Testing 10 concurrent requests (Sync - blocking the loop)")
    start = time.time()
    await asyncio.gather(*(sync_call() for _ in range(10)))
    print(f"Sync requests took: {time.time() - start:.2f} seconds")

    print("\nTesting 10 concurrent requests (Async - non-blocking)")
    start = time.time()
    await asyncio.gather(*(async_call() for _ in range(10)))
    print(f"Async requests took: {time.time() - start:.2f} seconds")

if __name__ == "__main__":
    asyncio.run(main())
