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

async def setup_benchmark():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(db_models.Base.metadata.create_all)

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as db:
        # insert 1000 dummy products
        products = []
        for i in range(1000):
            p = db_models.DBProduct(
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

        # insert jobs for some products
        for i in range(500):
            job = db_models.DBKnowledgeGraphJob(
                product_id=products[i].id,
                scientific_name=products[i].scientific_name,
                status="pending"
            )
            db.add(job)
        await db.commit()

    return async_session, products

async def run_baseline(async_session, products):
    async with async_session() as db:
        start_time = time.time()
        queued = 0

        for p in products:
            # Check if a pending, researching or idle job already exists
            job_stmt = select(db_models.DBKnowledgeGraphJob).where(
                db_models.DBKnowledgeGraphJob.product_id == p.id,
                db_models.DBKnowledgeGraphJob.status.in_(["pending", "researching", "idle"])
            )
            job_res = await db.execute(job_stmt)
            if job_res.scalars().first():
                continue # already queued

            kg_job = db_models.DBKnowledgeGraphJob(
                product_id=p.id,
                scientific_name=p.scientific_name,
                status="idle"
            )
            db.add(kg_job)
            await db.commit()
            await db.refresh(kg_job)

            queued += 1

        end_time = time.time()
        print(f"Baseline (N+1 query) took: {end_time - start_time:.4f} seconds")
        print(f"Queued: {queued}")
        return end_time - start_time

async def run_optimized(async_session, products):
    async with async_session() as db:
        start_time = time.time()
        queued = 0

        # Fetch all product IDs
        product_ids = [p.id for p in products]

        # Optimized query
        job_stmt = select(db_models.DBKnowledgeGraphJob.product_id).where(
            db_models.DBKnowledgeGraphJob.product_id.in_(product_ids),
            db_models.DBKnowledgeGraphJob.status.in_(["pending", "researching", "idle"])
        )
        job_res = await db.execute(job_stmt)
        existing_job_product_ids = set(job_res.scalars().all())

        for p in products:
            if p.id in existing_job_product_ids:
                continue # already queued

            kg_job = db_models.DBKnowledgeGraphJob(
                product_id=p.id,
                scientific_name=p.scientific_name,
                status="idle"
            )
            db.add(kg_job)
            await db.commit()
            await db.refresh(kg_job)

            queued += 1

        end_time = time.time()
        print(f"Optimized (batch query) took: {end_time - start_time:.4f} seconds")
        print(f"Queued: {queued}")
        return end_time - start_time

async def main():
    print("Setting up benchmark...")
    async_session, products = await setup_benchmark()

    print("Running baseline...")
    # Need to setup benchmark again to have same starting state for both
    async_session1, products1 = await setup_benchmark()
    t1 = await run_baseline(async_session1, products1)

    print("Running optimized...")
    async_session2, products2 = await setup_benchmark()
    t2 = await run_optimized(async_session2, products2)

    print(f"\nImprovement: {t1/t2:.2f}x faster")

if __name__ == "__main__":
    asyncio.run(main())
