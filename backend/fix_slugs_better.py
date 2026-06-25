import asyncio
import re
import unicodedata
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import AsyncSessionLocal
from db_models import DBDisease, DBSpecies

def slugify(text: str) -> str:
    text = text.lower()
    text = text.replace("ı", "i").replace("ö", "o").replace("ü", "u").replace("ş", "s").replace("ğ", "g").replace("ç", "c")
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(DBDisease))
        diseases = res.scalars().all()
        
        slug_map = {}
        for d in diseases:
            new_slug = slugify(d.slug)
            
            # Check if new_slug already mapped to another disease
            if new_slug in slug_map:
                # Duplicate found! Delete this one.
                print(f"Deleting duplicate disease: {d.slug} -> {new_slug}")
                await db.delete(d)
                # Ensure we have the target slug mapping
                slug_map[d.slug] = new_slug
            else:
                if new_slug != d.slug:
                    print(f"Updating disease slug: {d.slug} -> {new_slug}")
                    slug_map[d.slug] = new_slug
                    d.slug = new_slug
                else:
                    slug_map[d.slug] = new_slug
        
        await db.flush() # apply deletes and updates

        res = await db.execute(select(DBSpecies))
        species = res.scalars().all()
        for s in species:
            if s.diseases_slugs:
                new_slugs = []
                for ds in s.diseases_slugs:
                    ns = slug_map.get(ds) or slugify(ds)
                    if ns not in new_slugs:
                        new_slugs.append(ns)
                
                if new_slugs != s.diseases_slugs:
                    print(f"Updating species {s.slug} disease_slugs: {s.diseases_slugs} -> {new_slugs}")
                    s.diseases_slugs = new_slugs

        await db.commit()
        print("Done fixing slugs.")

if __name__ == "__main__":
    asyncio.run(main())
