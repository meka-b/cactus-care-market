import asyncio
import copy
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
import sys

from db_models import DBSettings

async def main():
    engine = create_async_engine("postgresql+asyncpg://yesil_admin:supersecretpassword@postgres:5432/yesil_dukkan")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        res = await db.execute(select(DBSettings).where(DBSettings.key == "global"))
        setting = res.scalars().first()
        if not setting:
            print("NO GLOBAL SETTINGS ROW FOUND!")
            setting = DBSettings(key="global", value={})
            db.add(setting)
            await db.commit()
            print("Created global setting row.")
        else:
            print(f"Current setting value: {setting.value}")
            
        update_data = {"plantnet": "testing-from-script-456"}
        val = copy.deepcopy(setting.value) if setting.value else {}
        if "api_keys" not in val:
            val["api_keys"] = {}
        for k, v in update_data.items():
            val["api_keys"][k] = v
            
        print(f"New val to be saved: {val}")
        
        stmt = update(DBSettings).where(DBSettings.key == "global").values(value=val)
        result = await db.execute(stmt)
        print(f"Update matched {result.rowcount} rows.")
        await db.commit()
        
        res2 = await db.execute(select(DBSettings).where(DBSettings.key == "global"))
        setting2 = res2.scalars().first()
        print(f"Value after update: {setting2.value}")

if __name__ == "__main__":
    asyncio.run(main())
