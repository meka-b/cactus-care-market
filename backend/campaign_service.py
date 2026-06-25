"""Campaign / Bundle calculation service.

Tüm hesaplamalar deterministiktir ve frontend doğrulaması için kullanılır.
Aynı zamanda checkout sırasında final indirim backend'de hesaplanır.

Desteklenen tipler:
- fixed_bundle:        Seçili ürünlerin toplamı yerine `bundle_price` uygulanır.
- percentage_bundle:   Seçili ürünlerin toplamına `discount_pct` % indirim.
- fixed_amount_bundle: Seçili ürünlerin toplamından `discount_amount` TL indirim.
- buy_x_get_y:         Primary ürün sepetteyse `free_product_id` ücretsiz eklenir.
- quantity_break:      Tek ürünün miktarına göre kademeli yüzde indirim.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_campaign_live(camp: dict) -> bool:
    """Aktif + tarih aralığında mı?"""
    if not camp.get("is_active", True):
        return False
    now = datetime.now(timezone.utc)
    sa = camp.get("start_at")
    ea = camp.get("end_at")
    try:
        if sa:
            d = datetime.fromisoformat(sa.replace("Z", "+00:00")) if isinstance(sa, str) else sa
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            if d > now:
                return False
        if ea:
            d = datetime.fromisoformat(ea.replace("Z", "+00:00")) if isinstance(ea, str) else ea
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            if d < now:
                return False
    except Exception:
        # tarih parse edilemezse aktif kabul et
        pass
    return True


def _collect_bundle_product_ids(camp: dict) -> list[str]:
    ids = [camp.get("primary_product_id")] + list(camp.get("related_product_ids") or [])
    if camp.get("free_product_id"):
        ids.append(camp["free_product_id"])
    return [x for x in ids if x]


async def fetch_campaigns_for_product(db, product_id: str) -> list[dict]:
    """Bir ürüne bağlı (primary veya related) tüm aktif & canlı kampanyaları döndürür.
    Öncelik sırasına göre sıralı (küçük priority önce)."""
    from sqlalchemy.future import select
    from db_models import DBCampaign
    from sqlalchemy import or_, cast, String
    
    stmt = select(DBCampaign).where(
        DBCampaign.is_active == True
    ).order_by(DBCampaign.priority.asc())
    
    result = await db.execute(stmt)
    items = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in result.scalars().all()]
    
    filtered = []
    for c in items:
        if c.get("primary_product_id") == product_id or product_id in (c.get("related_product_ids") or []):
            if is_campaign_live(c):
                filtered.append(c)
                
    return filtered


async def hydrate_campaign_products(db, camp: dict) -> dict:
    """Campaign'in product_id'lerini gerçek product dokümanlarına dönüştürür."""
    from sqlalchemy.future import select
    from db_models import DBProduct
    
    ids = _collect_bundle_product_ids(camp)
    products = {}
    if ids:
        result = await db.execute(select(DBProduct).where(DBProduct.id.in_(ids), DBProduct.is_published == True))
        for p in result.scalars().all():
            products[p.id] = {k: v for k, v in p.__dict__.items() if not k.startswith('_')}

    def thin(p):
        if not p:
            return None
        img = (p.get("images") or [{}])[0]
        return {
            "id": p.get("id"),
            "name": p.get("common_name_tr"),
            "slug": p.get("slug"),
            "price": p.get("price", 0),
            "stock": p.get("stock", 0),
            "image": img.get("thumb") or img.get("main"),
            "image_alt": img.get("alt"),
            "in_stock": (p.get("stock", 0) > 0),
        }

    enriched = {
        **camp,
        "primary_product": thin(products.get(camp.get("primary_product_id"))),
        "related_products": [thin(products[pid]) for pid in (camp.get("related_product_ids") or []) if pid in products],
        "free_product": thin(products.get(camp.get("free_product_id"))) if camp.get("free_product_id") else None,
        "live": is_campaign_live(camp),
    }
    # Stok özeti
    parts = []
    if enriched["primary_product"]:
        parts.append(enriched["primary_product"])
    parts.extend(enriched["related_products"])
    if enriched["free_product"]:
        parts.append(enriched["free_product"])
    enriched["any_out_of_stock"] = any(p and not p.get("in_stock") for p in parts) if parts else False
    return enriched


def calculate_bundle(camp: dict, selected_products: list[dict]) -> dict:
    """selected_products: [{id, price, quantity}]
    Returns: {valid, items, subtotal, discount, bundle_total, breakdown}
    """
    if not is_campaign_live(camp):
        return {"valid": False, "reason": "Kampanya aktif değil veya tarihi geçti.", "discount": 0, "subtotal": 0, "bundle_total": 0}

    ctype = camp.get("type")
    items = [{"product_id": p["id"], "price": float(p.get("price", 0)), "quantity": int(p.get("quantity", 1))} for p in selected_products]
    subtotal = sum(i["price"] * i["quantity"] for i in items)

    if ctype == "fixed_bundle":
        # Primary + en az bir related seçili olmalı
        primary = camp.get("primary_product_id")
        all_ids = [primary] + list(camp.get("related_product_ids") or [])
        sel_ids = {i["product_id"] for i in items}
        if primary not in sel_ids or len(sel_ids) < 2:
            return {"valid": False, "reason": "Birlikte alım için en az ana ürün + 1 ek ürün seçili olmalı."}
        # Yalnızca kampanyaya dahil ürünler kabul
        for i in items:
            if i["product_id"] not in all_ids:
                return {"valid": False, "reason": "Kampanya dışı ürün seçildi."}
        target = float(camp.get("bundle_price") or 0)
        discount = max(0, subtotal - target)
        return {
            "valid": True, "items": items, "subtotal": round(subtotal, 2),
            "discount": round(discount, 2), "bundle_total": round(max(0, subtotal - discount), 2),
            "breakdown": f"Birlikte Al: ₺{subtotal:.2f} → ₺{target:.2f}",
        }

    if ctype == "percentage_bundle":
        primary = camp.get("primary_product_id")
        sel_ids = {i["product_id"] for i in items}
        if primary not in sel_ids or len(sel_ids) < 2:
            return {"valid": False, "reason": "En az ana ürün + 1 ek ürün seçili olmalı."}
        pct = float(camp.get("discount_pct") or 0)
        discount = subtotal * pct / 100.0
        return {
            "valid": True, "items": items, "subtotal": round(subtotal, 2),
            "discount": round(discount, 2), "bundle_total": round(max(0, subtotal - discount), 2),
            "breakdown": f"%{pct:.0f} bundle indirimi",
        }

    if ctype == "fixed_amount_bundle":
        primary = camp.get("primary_product_id")
        sel_ids = {i["product_id"] for i in items}
        if primary not in sel_ids or len(sel_ids) < 2:
            return {"valid": False, "reason": "En az ana ürün + 1 ek ürün seçili olmalı."}
        amount = float(camp.get("discount_amount") or 0)
        discount = min(amount, subtotal)
        return {
            "valid": True, "items": items, "subtotal": round(subtotal, 2),
            "discount": round(discount, 2), "bundle_total": round(max(0, subtotal - discount), 2),
            "breakdown": f"Birlikte alımda -₺{amount:.2f}",
        }

    if ctype == "buy_x_get_y":
        primary = camp.get("primary_product_id")
        free_id = camp.get("free_product_id")
        free_qty = int(camp.get("free_qty") or 1)
        sel_ids = {i["product_id"] for i in items}
        if primary not in sel_ids or free_id not in sel_ids:
            return {"valid": False, "reason": "X+Y kampanyası için ana ürün ve ücretsiz ürün her ikisi de seçili olmalı."}
        free_item = next(i for i in items if i["product_id"] == free_id)
        discount = free_item["price"] * min(free_qty, free_item["quantity"])
        return {
            "valid": True, "items": items, "subtotal": round(subtotal, 2),
            "discount": round(discount, 2), "bundle_total": round(max(0, subtotal - discount), 2),
            "breakdown": f"{free_qty} adet ücretsiz",
        }

    if ctype == "quantity_break":
        primary = camp.get("primary_product_id")
        # Sadece ana ürünü etkiler
        prim_items = [i for i in items if i["product_id"] == primary]
        if not prim_items:
            return {"valid": False, "reason": "Ana ürün seçilmedi."}
        total_qty = sum(i["quantity"] for i in prim_items)
        tiers = sorted([t for t in (camp.get("quantity_tiers") or [])], key=lambda t: t.get("min_qty", 0))
        applied_pct = 0.0
        for t in tiers:
            if total_qty >= int(t.get("min_qty", 0)):
                applied_pct = float(t.get("discount_pct", 0))
        if applied_pct <= 0:
            return {"valid": False, "reason": "Bu miktarda indirim kademesi yok."}
        prim_subtotal = sum(i["price"] * i["quantity"] for i in prim_items)
        discount = prim_subtotal * applied_pct / 100.0
        return {
            "valid": True, "items": items, "subtotal": round(subtotal, 2),
            "discount": round(discount, 2), "bundle_total": round(max(0, subtotal - discount), 2),
            "breakdown": f"{total_qty} adet → %{applied_pct:.0f} indirim",
            "applied_pct": applied_pct, "qty": total_qty,
        }

    return {"valid": False, "reason": "Bilinmeyen kampanya tipi."}


async def validate_and_calc_for_cart(db, applied_campaigns: list[dict]) -> dict:
    """Checkout sırasında çağrılır.
    applied_campaigns: [{campaign_id, items:[{product_id, quantity}]}]
    Returns: {total_discount, breakdown:[{campaign_id, name, discount}], applied_campaign_ids}
    Çakışma engeli: aynı product_id birden fazla kampanyada ise sadece en yüksek
    önceliği (priority en küçük) olan uygulanır.
    """
    if not applied_campaigns:
        return {"total_discount": 0.0, "breakdown": [], "applied_campaign_ids": []}

    from sqlalchemy.future import select
    from db_models import DBCampaign, DBProduct

    # Tüm kampanyaları yükle
    camp_ids = [c["campaign_id"] for c in applied_campaigns]
    camps = {}
    c_res = await db.execute(select(DBCampaign).where(DBCampaign.id.in_(camp_ids)))
    for c in c_res.scalars().all():
        camps[c.id] = {k: v for k, v in c.__dict__.items() if not k.startswith('_')}

    # Ürün fiyatlarını yükle (snapshot)
    product_ids = set()
    for a in applied_campaigns:
        for it in a.get("items", []):
            product_ids.add(it["product_id"])
    products = {}
    p_res = await db.execute(select(DBProduct).where(DBProduct.id.in_(list(product_ids))))
    for p in p_res.scalars().all():
        products[p.id] = {k: v for k, v in p.__dict__.items() if not k.startswith('_')}

    # Öncelik sırasına göre sırala (priority ASC, eşitse created_at)
    ordered = []
    for a in applied_campaigns:
        c = camps.get(a["campaign_id"])
        if c:
            ordered.append((c.get("priority", 100), c, a))
    ordered.sort(key=lambda x: x[0])

    used_products = set()
    breakdown = []
    total_discount = 0.0
    applied_ids = []

    for prio, camp, a in ordered:
        # Çakışma: bu bundle'daki ürünlerden biri zaten başka bir bundle'da kullanıldıysa atla
        item_ids = [it["product_id"] for it in a.get("items", [])]
        if any(pid in used_products for pid in item_ids):
            continue
        # Stok kontrolü
        out_of_stock = False
        for it in a.get("items", []):
            prod = products.get(it["product_id"])
            if not prod or prod.get("stock", 0) < int(it.get("quantity", 1)):
                out_of_stock = True
                break
        if out_of_stock:
            continue
        # Hesapla
        selected_products = []
        for it in a.get("items", []):
            prod = products.get(it["product_id"], {})
            selected_products.append({
                "id": it["product_id"],
                "price": float(prod.get("price", 0)),
                "quantity": int(it.get("quantity", 1)),
            })
        res = calculate_bundle(camp, selected_products)
        if not res.get("valid"):
            continue
        total_discount += res.get("discount", 0)
        breakdown.append({
            "campaign_id": camp["id"],
            "name": camp.get("name"),
            "type": camp.get("type"),
            "discount": res.get("discount", 0),
            "breakdown": res.get("breakdown"),
        })
        applied_ids.append(camp["id"])
        for pid in item_ids:
            used_products.add(pid)

    return {
        "total_discount": round(total_discount, 2),
        "breakdown": breakdown,
        "applied_campaign_ids": applied_ids,
    }
