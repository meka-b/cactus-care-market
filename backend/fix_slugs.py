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
        # Fix Disease slugs
        res = await db.execute(select(DBDisease))
        diseases = res.scalars().all()
        for d in diseases:
            new_slug = slugify(d.slug)
            if new_slug != d.slug:
                print(f"Updating disease slug: {d.slug} -> {new_slug}")
                d.slug = new_slug
        
        # Fix Species disease_slugs
        res = await db.execute(select(DBSpecies))
        species = res.scalars().all()
        for s in species:
            if s.diseases_slugs:
                new_slugs = [slugify(ds) for ds in s.diseases_slugs]
                if new_slugs != s.diseases_slugs:
                    print(f"Updating species {s.slug} disease_slugs: {s.diseases_slugs} -> {new_slugs}")
                    s.diseases_slugs = new_slugs

        await db.commit()
        print("Done fixing slugs.")

if __name__ == "__main__":
    asyncio.run(main())
