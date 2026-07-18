import asyncio
import time
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlalchemy.future import select
import sys
import os

# add backend to path
sys.path.insert(0, os.path.abspath('backend'))
import db_models
from db_models import DBProduct

async def setup_benchmark():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(db_models.Base.metadata.create_all)

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as db:
        # insert 10000 dummy products
        products = []
        for i in range(10000):
            p = DBProduct(
                id=f"prod_{i}",
                scientific_name=f"Scientific {i}",
                common_name_tr=f"Common {i}",
                slug=f"slug_{i}",
                category="plant",
                care_level="easy",
                light_need="medium",
                water_need="medium",
                size="medium",
                pet_safe=True,
                pot_size="10cm",
                tags=[],
                short_description="Test short description",
                description="Test description",
                care_tips=[],
                meta_title="Test Title",
                meta_description="Test Meta Desc"
            )
            products.append(p)
            db.add(p)
        await db.commit()

    return async_session, products

async def run_baseline(async_session):
    async with async_session() as db:
        start_time = time.time()

        products = await db.execute(select(DBProduct))
        products_list = products.scalars().all()

        count = 0
        for p in products_list:
            content = f"# Ürün: {p.common_name_tr}\n"
            content += f"Fiyat: {p.price} TL\nKategori: {p.category}\n"
            content += f"Bakım Zorluğu: {p.care_level}\nIşık İhtiyacı: {p.light_need}\nSu İhtiyacı: {p.water_need}\nEvcil Hayvan Dostu: {'Evet' if p.pet_safe else 'Hayır'}\n"
            content += f"Kısa Açıklama: {p.short_description or ''}\nDetaylı Açıklama: {p.description or ''}\n"
            count += 1

        end_time = time.time()
        print(f"Baseline (.all()) took: {end_time - start_time:.4f} seconds, processed {count} products")
        return end_time - start_time, count

async def run_optimized(async_session):
    async with async_session() as db:
        start_time = time.time()

        count = 0
        limit = 1000
        offset = 0

        while True:
            products = await db.execute(select(DBProduct).limit(limit).offset(offset))
            batch = products.scalars().all()
            if not batch:
                break

            for p in batch:
                content = f"# Ürün: {p.common_name_tr}\n"
                content += f"Fiyat: {p.price} TL\nKategori: {p.category}\n"
                content += f"Bakım Zorluğu: {p.care_level}\nIşık İhtiyacı: {p.light_need}\nSu İhtiyacı: {p.water_need}\nEvcil Hayvan Dostu: {'Evet' if p.pet_safe else 'Hayır'}\n"
                content += f"Kısa Açıklama: {p.short_description or ''}\nDetaylı Açıklama: {p.description or ''}\n"
                count += 1

            offset += limit

        end_time = time.time()
        print(f"Optimized (batch processing) took: {end_time - start_time:.4f} seconds, processed {count} products")
        return end_time - start_time, count

async def run_yield_per(async_session):
    async with async_session() as db:
        start_time = time.time()

        count = 0
        products_result = await db.stream(select(DBProduct).execution_options(yield_per=1000))
        async for p in products_result.scalars():
            content = f"# Ürün: {p.common_name_tr}\n"
            content += f"Fiyat: {p.price} TL\nKategori: {p.category}\n"
            content += f"Bakım Zorluğu: {p.care_level}\nIşık İhtiyacı: {p.light_need}\nSu İhtiyacı: {p.water_need}\nEvcil Hayvan Dostu: {'Evet' if p.pet_safe else 'Hayır'}\n"
            content += f"Kısa Açıklama: {p.short_description or ''}\nDetaylı Açıklama: {p.description or ''}\n"
            count += 1

        end_time = time.time()
        print(f"Optimized (yield_per) took: {end_time - start_time:.4f} seconds, processed {count} products")
        return end_time - start_time, count

async def main():
    print("Setting up benchmark...")
    async_session, products = await setup_benchmark()

    print("Running baseline...")
    t1, _ = await run_baseline(async_session)

    print("Running optimized with yield_per...")
    t2, _ = await run_yield_per(async_session)

    print("Running optimized with offset/limit...")
    t3, _ = await run_optimized(async_session)

    print(f"\nYield_per vs Baseline: {t1/t2:.2f}x faster")
    print(f"Offset/limit vs Baseline: {t1/t3:.2f}x faster")

if __name__ == "__main__":
    asyncio.run(main())
