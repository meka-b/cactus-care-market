import asyncio
import uuid
from database import AsyncSessionLocal
from settings_service import get_taxonomy, update_taxonomy, clear_cache

async def restore():
    async with AsyncSessionLocal() as db:
        tax = await get_taxonomy(db)
        
        # Default Categories
        default_categories = [
            {"name": "Kaktüsler", "slug": "kaktusler"},
            {"name": "Sukulentler", "slug": "sukulentler"},
            {"name": "Salon Bitkileri", "slug": "salon-bitkileri"},
            {"name": "Teraryumlar", "slug": "teraryumlar"}
        ]
        
        # Default Care Levels
        default_care_levels = [
            {"name": "Kolay Bakım", "slug": "kolay-bakim", "type": "care_level"},
            {"name": "Orta Seviye", "slug": "orta-seviye", "type": "care_level"},
            {"name": "Deneyimli", "slug": "deneyimli", "type": "care_level"}
        ]
        
        # Default Light Needs
        default_light_needs = [
            {"name": "Tam Güneş", "slug": "tam-gunes", "type": "light_need"},
            {"name": "Yarı Gölge", "slug": "yari-golge", "type": "light_need"},
            {"name": "Az Işık", "slug": "az-isik", "type": "light_need"}
        ]
        
        # Default Water Needs
        default_water_needs = [
            {"name": "Çok Az Su", "slug": "cok-az-su", "type": "water_need"},
            {"name": "Haftada Bir", "slug": "haftada-bir", "type": "water_need"},
            {"name": "Sık Sulama", "slug": "sik-sulama", "type": "water_need"}
        ]
        
        # Default Sizes
        default_sizes = [
            {"name": "Mini", "slug": "mini", "type": "size"},
            {"name": "Küçük", "slug": "kucuk", "type": "size"},
            {"name": "Orta", "slug": "orta", "type": "size"},
            {"name": "Büyük", "slug": "buyuk", "type": "size"}
        ]
        
        # Default Pet Safe
        default_pet_safe = [
            {"name": "Pet Friendly", "slug": "pet-friendly", "type": "pet_safe"}
        ]

        def merge_list(target, defaults, type_match=None):
            for d in defaults:
                exists = False
                for t in target:
                    if t.get("slug") == d["slug"] and (type_match is None or t.get("type") == type_match):
                        exists = True
                        break
                if not exists:
                    d["id"] = str(uuid.uuid4())
                    d["status"] = "active"
                    d["seo_title"] = ""
                    d["seo_description"] = ""
                    d["geo_targeting"] = ""
                    d["llm_prompt"] = ""
                    d["serp_keywords"] = []
                    target.append(d)

        merge_list(tax["product_categories"], default_categories)
        
        filters = tax.get("filters", [])
        merge_list(filters, default_care_levels, "care_level")
        merge_list(filters, default_light_needs, "light_need")
        merge_list(filters, default_water_needs, "water_need")
        merge_list(filters, default_sizes, "size")
        merge_list(filters, default_pet_safe, "pet_safe")
        tax["filters"] = filters

        await update_taxonomy(db, tax)
        clear_cache()
        print("Restored default taxonomy.")

if __name__ == "__main__":
    asyncio.run(restore())
