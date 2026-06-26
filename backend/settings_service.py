"""Settings service: read-from-DB with ENV fallback. Single doc at db.settings(key='global')."""
import os
from typing import Any, Dict
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from db_models import DBSettings

DEFAULT_LANDING_VISIBILITY = {
    # 9 categories visible by default
    "kaktusler": True, "sukulentler": True, "ic-mekan-bitkileri": True, "dis-mekan-bitkileri": True,
    "meyve-fidanlari": True, "cicekler": True, "tirmanici-bitkiler": True, "palmiyeler": True, "bonsailer": True,
    # care/light/water/size/pet
    "kolay-bakim-bitkileri": True, "orta-bakim-bitkileri": True, "uzman-bakim-bitkileri": True,
    "tam-gunes-seven-bitkiler": True, "yari-golge-bitkileri": True, "golge-bitkileri": True,
    "az-sulanan-bitkiler": True, "orta-sulanan-bitkiler": True, "yuksek-sulanan-bitkiler": True,
    "mini-bitkiler": True, "kucuk-bitkiler": True, "orta-boy-bitkiler": True, "buyuk-bitkiler": True,
    "pet-friendly-bitkiler": True,
}

DEFAULT_HEADER_LINKS = [
    {"label": "Kaktüsler", "url": "/k/kaktusler", "order": 1, "visible": True},
    {"label": "Sukulentler", "url": "/k/sukulentler", "order": 2, "visible": True},
    {"label": "İç Mekan", "url": "/k/ic-mekan-bitkileri", "order": 3, "visible": True},
    {"label": "Kolay Bakım", "url": "/k/kolay-bakim-bitkileri", "order": 4, "visible": True},
    {"label": "Pet Friendly", "url": "/k/pet-friendly-bitkiler", "order": 5, "visible": True},
    {"label": "Blog", "url": "/blog", "order": 6, "visible": True},
]


def default_settings() -> Dict[str, Any]:
    return {
        "key": "global",
        "api_keys": {
            "plantnet": "",
            "mistral": "",
            "iyzico_api": "",
            "iyzico_secret": "",
            "resend": "",
            "ga_id": "",
        },
        "menu": {
            "header_links": DEFAULT_HEADER_LINKS,
            "landing_visibility": DEFAULT_LANDING_VISIBILITY,
        },
        "general": {
            "site_name": "Yeşil Dükkan",
            "contact_email": "info@yesildukkan.com",
            "free_shipping_threshold": 500.0,
            "shipping_fee": 39.90,
        },
    }


def _merge_dicts(base: dict, update: dict) -> dict:
    """Deep merge for 2 levels."""
    for k, v in update.items():
        if isinstance(v, dict) and k in base and isinstance(base[k], dict):
            base[k].update(v)
        else:
            base[k] = v
    return base


async def get_settings(db: AsyncSession) -> Dict[str, Any]:
    result = await db.execute(select(DBSettings).where(DBSettings.key == "global"))
    doc = result.scalars().first()
    defaults = default_settings()
    if not doc:
        return defaults
    # Merge DB overrides into defaults
    return _merge_dicts(defaults, doc.value)


async def _update_section(db: AsyncSession, section: str, updates: dict):
    # Fetch existing
    result = await db.execute(select(DBSettings).where(DBSettings.key == "global"))
    doc = result.scalars().first()
    
    defaults = default_settings()
    if doc:
        current_val = doc.value
    else:
        current_val = defaults.copy()

    if section not in current_val:
        current_val[section] = {}
        
    for k, v in updates.items():
        if v is not None:
            current_val[section][k] = v
            
    if doc:
        # Assign back to trigger JSON mutation tracking in SQLAlchemy if needed,
        # or just flag as modified (best is to re-assign a copy)
        import copy
        new_val = copy.deepcopy(current_val)
        doc.value = new_val
    else:
        doc = DBSettings(key="global", value=current_val)
        db.add(doc)
        
    await db.commit()


async def update_api_keys(db: AsyncSession, keys: dict):
    await _update_section(db, "api_keys", keys)


async def update_menu(db: AsyncSession, menu: dict):
    # For menu, we might overwrite entirely rather than shallow merge fields
    updates = {}
    if menu.get("header_links") is not None:
        updates["header_links"] = menu["header_links"]
    if menu.get("landing_visibility") is not None:
        # merge visibility
        settings = await get_settings(db)
        vis = settings["menu"].get("landing_visibility", {}).copy()
        vis.update(menu["landing_visibility"])
        updates["landing_visibility"] = vis
    if updates:
        await _update_section(db, "menu", updates)


async def update_general(db: AsyncSession, general: dict):
    await _update_section(db, "general", general)


async def get_api_key(db: AsyncSession, key_name: str) -> str:
    """Helper to fetch a specific API key (used by services)."""
    settings = await get_settings(db)
    return settings["api_keys"].get(key_name, "")


async def get_shipping_info(db: AsyncSession) -> tuple[float, float]:
    """Returns (threshold, fee)."""
    s = await get_settings(db)
    g = s.get("general", {})
    return float(g.get("free_shipping_threshold", 500.0)), float(g.get("shipping_fee", 39.90))

async def public_menu(db: AsyncSession) -> Dict[str, Any]:
    s = await get_settings(db)
    return s.get("menu", default_settings()["menu"])

async def settings_to_admin_view(db: AsyncSession) -> Dict[str, Any]:
    return await get_settings(db)

