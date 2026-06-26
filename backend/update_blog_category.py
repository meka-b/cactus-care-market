import asyncio
import uuid
from database import AsyncSessionLocal
from db_models import DBBlogPost
from sqlalchemy import select
from settings_service import get_taxonomy, update_taxonomy, clear_cache

async def run():
    async with AsyncSessionLocal() as db:
        # Create category
        tax = await get_taxonomy(db)
        blog_cats = tax.get("blog_categories", [])
        
        # Check if already exists
        exists = False
        cat_name = "Kaktüs Bakımı"
        cat_slug = "kaktus-bakimi"
        for c in blog_cats:
            if c.get("slug") == cat_slug:
                exists = True
                break
        
        if not exists:
            blog_cats.append({
                "id": str(uuid.uuid4()),
                "name": cat_name,
                "slug": cat_slug,
                "status": "active",
                "seo_title": "",
                "seo_description": "",
                "geo_targeting": "",
                "llm_prompt": "",
                "serp_keywords": []
            })
            tax["blog_categories"] = blog_cats
            await update_taxonomy(db, tax)
            clear_cache()
            print("Created blog category: Kaktüs Bakımı")

        # Move all blog posts
        stmt = select(DBBlogPost)
        posts = (await db.execute(stmt)).scalars().all()
        for p in posts:
            p.category = cat_name
            db.add(p)
        await db.commit()
        print(f"Updated {len(posts)} blog posts to category '{cat_name}'.")

if __name__ == "__main__":
    asyncio.run(run())
