import asyncio
from database import AsyncSessionLocal
from settings_service import get_taxonomy

async def main():
    db = AsyncSessionLocal()
    tax = await get_taxonomy(db)
    print(tax)
    await db.close()

if __name__ == "__main__":
    asyncio.run(main())
