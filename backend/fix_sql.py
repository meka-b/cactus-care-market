import asyncio
from database import AsyncSessionLocal
from sqlalchemy import text
from db_models import DBDisease, DBSpecies
from sqlalchemy.future import select

def slug_clean(s):
    return s.lower().replace("ı", "i").replace("ö", "o").replace("ü", "u").replace("ş", "s").replace("ğ", "g").replace("ç", "c").replace(" ", "-")

async def fix():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(DBDisease))
        diseases = res.scalars().all()
        
        seen = set()
        for d in diseases:
            clean = slug_clean(d.slug)
            if clean in seen:
                await db.delete(d)
            else:
                seen.add(clean)
                d.slug = clean
        await db.flush()

        res = await db.execute(select(DBSpecies))
        species = res.scalars().all()
        for s in species:
            if s.diseases_slugs:
                s.diseases_slugs = list(set([slug_clean(ds) for ds in s.diseases_slugs]))
        
        await db.commit()

asyncio.run(fix())
