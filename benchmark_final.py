import asyncio
import time
import httpx

async def simulate_async_request():
    async with httpx.AsyncClient() as client:
        # Simulate delay
        await asyncio.sleep(0.5)

async def non_blocking_task():
    await simulate_async_request()
    await simulate_async_request()

async def run_benchmark():
    start = time.time()
    tasks = [non_blocking_task() for _ in range(5)]
    await asyncio.gather(*tasks)
    end = time.time()
    print(f"Time taken for 5 concurrent requests (non-blocking): {end - start:.2f} seconds")

asyncio.run(run_benchmark())
