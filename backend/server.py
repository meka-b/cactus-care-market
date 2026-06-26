"""Yeşil Dükkan - FastAPI backend main entrypoint."""
import os
import logging
import json
import re
import copy
from pathlib import Path
from datetime import datetime, timezone
from dateutil import parser as dateparser
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr

from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, Request, Form
from fastapi.responses import FileResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from database import get_db, AsyncSessionLocal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, desc, update, cast, String, delete
from sqlalchemy.orm import selectinload
from dotenv import load_dotenv
from slugify import slugify
from slugify import slugify
import rag_service
from routers import seo_engine
from routers import exa_router
from routers import knowledge_graph
from kg_agent import trigger_kg_blueprint_research

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Local imports (after env loaded)
from db_models import (
    DBProduct, DBUser, DBOrder, DBOrderItem, DBWishlistItem, 
    DBReview, DBCoupon, DBBlogPost, DBCampaign, DBSettings, DBKnowledgeGraphJob, DBRagDocument, DBRagChunk
)
# Local imports (after env loaded)
from models import (
    Product, ProductCreate, ProductUpdate, ProductImage,
    UserRegister, UserLogin, User, CheckoutRequest, Order, OrderItem, AISuggestion,
    Review, ReviewCreate, Coupon, CouponCreate, CouponUpdate, CouponValidate,
    BlogPost, BlogPostCreate, BlogPostUpdate, BlogSEORequest,
    ChatRequest, APIKeysUpdate, MenuUpdate, GeneralUpdate,
    Campaign, CampaignCreate, CampaignUpdate, BundleCalcRequest,
    UserProfileUpdate, UserPasswordUpdate
)
from constants import (
    LANDING_PAGES, CATEGORIES, CARE_LEVELS, LIGHT_NEEDS, WATER_NEEDS, SIZES, POT_SIZES,
    CATEGORY_SLUG, compute_tags_from_taxonomy
)
import settings_service
from auth import (
    hash_password, verify_password, create_token, get_current_user, require_admin, optional_user
)
from image_service import optimize_and_save, MEDIA_ROOT
import ai_service
import email_service
import payment_service
import campaign_service

# --- App
app = FastAPI(title="Yeşil Dükkan API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("yesildukkan")


def _clean(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


# ============================================================
# HEALTH
# ============================================================
@api.get("/")
async def root():
    return {"message": "Yeşil Dükkan API", "status": "ok"}


# ============================================================
# AUTH
# ============================================================
@api.post("/auth/register")
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.email == data.email))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")
    
    user = DBUser(
        email=data.email, 
        name=data.name, 
        role="customer",
        password_hash=hash_password(data.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    token = create_token(user.id, user.role)
    try:
        await email_service.send_welcome_email(db, data.email, data.name)
    except Exception as e:
        logger.warning(f"welcome email skipped: {e}")
    
    user_dict = {k: v for k, v in user.__dict__.items() if not k.startswith('_')}
    return {"token": token, "user": user_dict, "message": "Hoş geldiniz!"}


@api.post("/auth/login")
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.email == data.email))
    user = result.scalars().first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    
    token = create_token(user.id, user.role)
    user_dict = {k: v for k, v in user.__dict__.items() if not k.startswith('_')}
    return {"token": token, "user": user_dict}


@api.get("/auth/me")
async def me(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.id == user["user_id"]))
    user_obj = result.scalars().first()
    if not user_obj:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    doc = {k: v for k, v in user_obj.__dict__.items() if not k.startswith('_') and k != 'password_hash'}
    return doc


@api.put("/auth/profile")
async def update_profile(data: UserProfileUpdate, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.id == user["user_id"]))
    user_obj = result.scalars().first()
    if not user_obj:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    user_obj.name = data.name
    await db.commit()
    return {"message": "Profil güncellendi"}


@api.put("/auth/password")
async def update_password(data: UserPasswordUpdate, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.id == user["user_id"]))
    user_obj = result.scalars().first()
    if not user_obj:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if not verify_password(data.current_password, user_obj.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
        
    user_obj.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"message": "Şifre güncellendi"}


# ============================================================
# RAG endpoints
# ============================================================
from fastapi import BackgroundTasks

@api.post("/admin/rag/sync")
async def admin_rag_sync(user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    try:
        # 1. Delete existing auto-synced documents (products and blogs)
        old_docs = await db.execute(select(DBRagDocument).where(DBRagDocument.source_type.in_(["product", "blog"])))
        for d in old_docs.scalars().all():
            await db.execute(delete(DBRagChunk).where(DBRagChunk.document_id == d.id))
            await db.delete(d)
        await db.commit()

        # 2. Fetch all products
        products = await db.execute(select(DBProduct))
        product_count = 0
        for p in products.scalars().all():
            content = f"# Ürün: {p.common_name_tr}\n"
            content += f"Fiyat: {p.price} TL\nKategori: {p.category}\n"
            content += f"Bakım Zorluğu: {p.care_level}\nIşık İhtiyacı: {p.light_need}\nSu İhtiyacı: {p.water_need}\nEvcil Hayvan Dostu: {'Evet' if p.pet_safe else 'Hayır'}\n"
            content += f"Kısa Açıklama: {p.short_description or ''}\nDetaylı Açıklama: {p.description or ''}\n"
            
            await rag_service.ingest_document(f"Ürün: {p.common_name_tr}", "product", content, db)
            product_count += 1

        # 3. Fetch all blogs
        blogs = await db.execute(select(DBBlogPost).where(DBBlogPost.status == 'published'))
        blog_count = 0
        for b in blogs.scalars().all():
            content = f"# Blog Makalesi: {b.title}\n"
            content += f"Özet: {b.excerpt or ''}\n\nİçerik:\n{b.content or ''}"
            
            await rag_service.ingest_document(f"Makale: {b.title}", "blog", content, db)
            blog_count += 1
            
        return {"message": f"{product_count} ürün ve {blog_count} makale başarıyla RAG sistemine senkronize edildi."}
    except Exception as e:
        import logging
        logging.error(f"RAG sync error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api.post("/admin/rag/upload")
async def admin_rag_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    user=Depends(require_admin), 
    db: AsyncSession = Depends(get_db)
):
    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Sadece UTF-8 metin (.md, .json) desteklenir.")
    
    source_type = "json" if file.filename.endswith(".json") else "markdown"
    
    # Arka planda işlemek için yeni bir session oluşturmalıyız
    # çünkü db session request bitince kapanır.
    async def process_in_background(fname, stype, cstr):
        async with AsyncSessionLocal() as session:
            try:
                await rag_service.ingest_document(
                    filename=fname,
                    source_type=stype,
                    content=cstr,
                    db=session
                )
            except Exception as e:
                logging.error(f"RAG ingest error: {e}")

    background_tasks.add_task(process_in_background, file.filename, source_type, content_str)
    
    return {"status": "success", "message": "Dosya arka planda işleniyor. Kısa süre sonra istatistiklere yansıyacaktır."}

@api.get("/admin/rag/stats")
async def admin_rag_stats(user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    doc_count = (await db.execute(select(func.count(DBRagDocument.id)))).scalar() or 0
    chunk_count = (await db.execute(select(func.count(DBRagChunk.id)))).scalar() or 0
    
    docs_result = await db.execute(select(DBRagDocument).order_by(desc(DBRagDocument.created_at)).limit(10))
    docs = docs_result.scalars().all()
    recent_docs = [{"id": d.id, "filename": d.filename, "type": d.source_type, "chars": d.char_count, "created_at": d.created_at} for d in docs]
    
    return {
        "documents": doc_count,
        "chunks": chunk_count,
        "recent_files": recent_docs
    }

@api.delete("/admin/rag/documents/{doc_id}")
async def admin_rag_delete(doc_id: str, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import delete
    doc_res = await db.execute(select(DBRagDocument).where(DBRagDocument.id == doc_id))
    doc = doc_res.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doküman bulunamadı")
    
    await db.execute(delete(DBRagChunk).where(DBRagChunk.document_id == doc.id))
    await db.delete(doc)
    await db.commit()
    return {"message": "Doküman ve bağlı parçaları (chunks) başarıyla silindi."}

class RagGenerateRequest(BaseModel):
    prompt: str

@api.post("/admin/rag/generate")
async def admin_rag_generate(req: RagGenerateRequest, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    # 1. Fetch RAG Context
    rag_results = await rag_service.search_rag(req.prompt, db, top_k=4)
    rag_context = "\n---\n".join([r["content"] for r in rag_results])
    
    # 2. Call Mistral
    import ai_service
    keys = await ai_service._keys(db)
    if not keys["mistral"]:
        raise HTTPException(400, "Mistral API anahtarı ayarlı değil.")
        
    prompt = f"""Sen Yeşil Dükkan'ın uzman içerik üreticisisin. 
Kullanıcının isteğine göre seo-dostu ve kaliteli bir metin üret.
AŞAĞIDAKİ BİLGİ BANKASI VERİLERİNİ (RAG) MUTLAKA KULLAN:
{rag_context}

KULLANICI İSTEĞİ:
{req.prompt}

DİKKAT:
- Bilgi bankasındaki veriler İNGİLİZCE olabilir. Sen bu bilgileri kavrayıp HER ZAMAN KESİNLİKLE TÜRKÇE, akıcı ve doğal bir dil ile içerik üreteceksin.
- KENDİ YORUMUNU KATMA: Sadece sana verilen bilgi bankasındaki gerçeklere (RAG verilerine) BİREBİR sadık kal. Ekstra hikaye, abartı veya kendi uydurduğun bilgileri kesinlikle ekleme. Nesnel ol.
- SADECE üretilen Türkçe metni ver, başka bir şey yazma (İngilizce kelime veya alıntı bırakma)."""
    import requests
    headers = {"Authorization": f"Bearer {keys['mistral']}", "Content-Type": "application/json"}
    payload = {
        "model": "mistral-large-latest",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1
    }
    r = requests.post("https://api.mistral.ai/v1/chat/completions", headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    body = r.json()
    return {"content": body["choices"][0]["message"]["content"]}

# ============================================================
# PRODUCTS - Public
# ============================================================

def _build_filter(category: Optional[str] = None, care: Optional[str] = None,
                  light: Optional[str] = None, water: Optional[str] = None,
                  size: Optional[str] = None, pet_safe: Optional[bool] = None,
                  pot_size: Optional[str] = None,
                  tag: Optional[str] = None, search: Optional[str] = None,
                  min_price: Optional[float] = None, max_price: Optional[float] = None,
                  featured: Optional[bool] = None, in_stock: Optional[bool] = None,
                  scientific_species: Optional[str] = None,
                  is_published: Optional[bool] = True) -> list:
    f = []
    if is_published is not None:
        f.append(DBProduct.is_published == is_published)
    if category:
        f.append(DBProduct.category == category)
    if care:
        f.append(DBProduct.care_level == care)
    if light:
        f.append(DBProduct.light_need == light)
    if water:
        f.append(DBProduct.water_need == water)
    if size:
        f.append(DBProduct.size == size)
    if pet_safe is not None:
        f.append(DBProduct.pet_safe == pet_safe)
    if pot_size:
        f.append(DBProduct.pot_size == pot_size)
    if tag:
        f.append(cast(DBProduct.tags, String).ilike(f'%"{tag}"%'))
    if scientific_species:
        f.append(DBProduct.scientific_species == scientific_species)
    if featured is not None:
        f.append(DBProduct.is_featured == featured)
    if in_stock:
        f.append(DBProduct.stock > 0)
    if min_price is not None:
        f.append(DBProduct.price >= min_price)
    if max_price is not None:
        f.append(DBProduct.price <= max_price)
    if search:
        f.append(or_(
            DBProduct.common_name_tr.ilike(f"%{search}%"),
            DBProduct.scientific_name.ilike(f"%{search}%"),
            DBProduct.description.ilike(f"%{search}%")
        ))
    return f


@api.get("/products")
async def list_products(
    category: Optional[str] = None, care: Optional[str] = None, light: Optional[str] = None,
    water: Optional[str] = None, size: Optional[str] = None, pet_safe: Optional[bool] = None,
    pot_size: Optional[str] = None, scientific_species: Optional[str] = None,
    tag: Optional[str] = None, search: Optional[str] = None,
    min_price: Optional[float] = None, max_price: Optional[float] = None,
    featured: Optional[bool] = None, in_stock: Optional[bool] = None,
    sort: str = "newest", page: int = 1, limit: int = 24,
    db: AsyncSession = Depends(get_db)
):
    filters = _build_filter(category, care, light, water, size, pet_safe, pot_size, tag, search, min_price, max_price, featured, in_stock, scientific_species, True)
    
    sort_options = {
        "newest": desc(DBProduct.created_at),
        "price_asc": DBProduct.price.asc(),
        "price_desc": DBProduct.price.desc(),
        "name": DBProduct.common_name_tr.asc()
    }
    order_by_clause = sort_options.get(sort, desc(DBProduct.created_at))
    
    skip = max(0, (page - 1) * limit)
    
    stmt = select(DBProduct).where(*filters).order_by(order_by_clause).offset(skip).limit(limit)
    result = await db.execute(stmt)
    items = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in result.scalars().all()]
    
    count_stmt = select(func.count(DBProduct.id)).where(*filters)
    total = (await db.execute(count_stmt)).scalar() or 0
    
    return {"items": items, "total": total, "page": page, "limit": limit, "pages": (total + limit - 1) // limit}


@api.get("/products/featured")
async def featured_products(limit: int = 8, db: AsyncSession = Depends(get_db)):
    stmt = select(DBProduct).where(DBProduct.is_published == True, DBProduct.is_featured == True).order_by(desc(DBProduct.created_at)).limit(limit)
    result = await db.execute(stmt)
    items = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in result.scalars().all()]
    
    if not items:
        # Fallback to newest
        stmt = select(DBProduct).where(DBProduct.is_published == True).order_by(desc(DBProduct.created_at)).limit(limit)
        result = await db.execute(stmt)
        items = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in result.scalars().all()]
    return {"items": items}


@api.get("/products/by-slug/{slug}")
async def get_product_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = select(DBProduct).where(DBProduct.slug == slug, DBProduct.is_published == True)
    result = await db.execute(stmt)
    product_obj = result.scalars().first()
    
    if not product_obj:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        
    doc = {k: v for k, v in product_obj.__dict__.items() if not k.startswith('_')}
    
    # Related products: same category, exclude self
    related_stmt = select(DBProduct).where(
        DBProduct.category == product_obj.category,
        DBProduct.slug != slug,
        DBProduct.is_published == True
    ).limit(8)
    related_result = await db.execute(related_stmt)
    related = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in related_result.scalars().all()]
    
    return {"product": doc, "related": related}


# ============================================================
# LANDING PAGES (SEO)
# ============================================================
@api.get("/landing/{slug}")
async def get_landing(slug: str, page: int = 1, limit: int = 24, sort: str = "newest", in_stock: Optional[bool] = None, db: AsyncSession = Depends(get_db)):
    meta = LANDING_PAGES.get(slug)
    if not meta:
        raise HTTPException(status_code=404, detail="Sayfa bulunamadı")
    
    mf = dict(meta["filter"])
    filters = _build_filter(
        category=mf.get("category"),
        care=mf.get("care_level"),
        light=mf.get("light_need"),
        water=mf.get("water_need"),
        size=mf.get("size"),
        pet_safe=mf.get("pet_safe"),
        pot_size=mf.get("pot_size"),
        tag=mf.get("tag"),
        in_stock=in_stock,
        scientific_species=None,
        is_published=True
    )
    
    sort_options = {
        "newest": desc(DBProduct.created_at),
        "price_asc": DBProduct.price.asc(),
        "price_desc": DBProduct.price.desc(),
        "name": DBProduct.common_name_tr.asc()
    }
    order_by_clause = sort_options.get(sort, desc(DBProduct.created_at))
    skip = max(0, (page - 1) * limit)
    
    stmt = select(DBProduct).where(*filters).order_by(order_by_clause).offset(skip).limit(limit)
    result = await db.execute(stmt)
    items = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in result.scalars().all()]
    
    count_stmt = select(func.count(DBProduct.id)).where(*filters)
    total = (await db.execute(count_stmt)).scalar() or 0
    
    return {
        "slug": slug,
        "h1": meta["h1"],
        "title": meta["title"],
        "description": meta["desc"],
        "filter": meta["filter"],
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@api.get("/landing")
async def list_landing_slugs():
    """Return all landing page slugs (for sitemap/nav)."""
    out = []
    for s, m in LANDING_PAGES.items():
        out.append({"slug": s, "title": m["h1"], "filter": m["filter"]})
    return {"items": out}


# ============================================================
# TAXONOMY
# ============================================================
@api.get("/taxonomy")
async def get_taxonomy():
    return {
        "categories": CATEGORIES,
        "care_levels": CARE_LEVELS,
        "light_needs": LIGHT_NEEDS,
        "water_needs": WATER_NEEDS,
        "sizes": SIZES,
        "pot_sizes": POT_SIZES,
    }


# ============================================================
# ADMIN - AI Analyze (PlantNet + Mistral)
# ============================================================
@api.post("/admin/ai/analyze")
async def admin_ai_analyze(file: UploadFile = File(...), product_name: Optional[str] = Form(None), user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Analyze a plant image: PlantNet + Mistral. Returns AI suggestion JSON + optimized image."""
    contents = await file.read()
    # Optimize image first
    img = optimize_and_save(contents)
    # AI analysis (use product_name if provided)
    pn = (product_name or "").strip()
    try:
        ai = await ai_service.analyze_plant_image(contents, db, product_name=pn)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("AI analyze failed")
        raise HTTPException(status_code=500, detail=f"AI analiz hatası: {e}")

    # If admin provided name, override common_name_tr
    if pn:
        ai["common_name_tr"] = pn

    return {
        "suggestion": ai,
        "image": {"main": img["main"], "thumb": img["thumb"], "alt": ai.get("alt_text", "")},
    }


@api.post("/admin/ai/sync")
async def admin_ai_sync(
    form_data: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    user=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    import json
    try:
        current_data = json.loads(form_data)
    except Exception:
        raise HTTPException(status_code=400, detail="form_data geçerli JSON değil")
        
    images_bytes = []
    saved_images = []
    
    for f in files:
        contents = await f.read()
        images_bytes.append(contents)
        saved = optimize_and_save(contents)
        saved_images.append(saved)
        
    try:
        ai = await ai_service.sync_plant_data(images_bytes, current_data, db)
    except Exception as e:
        logger.exception("AI sync failed")
        raise HTTPException(status_code=500, detail=f"AI senkronizasyon hatası: {e}")
        
    alt_texts = ai.get("alt_texts", [])
    for i, s in enumerate(saved_images):
        s["alt"] = alt_texts[i] if i < len(alt_texts) else ""
        
    return {
        "suggestion": ai,
        "images": saved_images
    }


@api.post("/admin/ai/blog-seo")
async def admin_blog_seo(req: BlogSEORequest, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Generate SEO suggestions for a blog post."""
    try:
        out = await ai_service.generate_blog_seo(req.title, db, req.excerpt or "", req.target_keywords or "")
        return out
    except Exception as e:
        logger.exception("Blog SEO generation failed")
        raise HTTPException(status_code=500, detail=f"AI SEO hatası: {e}")


# ============================================================
# ADMIN - Product CRUD
# ============================================================
@api.post("/admin/products")
async def admin_create_product(data: ProductCreate, background_tasks: BackgroundTasks, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    # Recompute tags
    tags = compute_tags_from_taxonomy(
        data.category, data.care_level, data.light_need, data.water_need, data.size, data.pet_safe
    )
    # Validate enums
    if data.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Geçersiz kategori: {data.category}")
    if data.care_level not in CARE_LEVELS:
        raise HTTPException(status_code=400, detail="Geçersiz bakım seviyesi")
    if data.light_need not in LIGHT_NEEDS:
        raise HTTPException(status_code=400, detail="Geçersiz ışık ihtiyacı")
    if data.water_need not in WATER_NEEDS:
        raise HTTPException(status_code=400, detail="Geçersiz sulama")
    if data.size not in SIZES:
        raise HTTPException(status_code=400, detail="Geçersiz boyut")
    if data.pot_size and data.pot_size not in POT_SIZES:
        raise HTTPException(status_code=400, detail="Geçersiz saksı çapı")
    
    # Unique slug
    stmt = select(DBProduct).where(DBProduct.slug == data.slug)
    result = await db.execute(stmt)
    if result.scalars().first():
        base = data.slug
        i = 2
        while True:
            stmt = select(DBProduct).where(DBProduct.slug == f"{base}-{i}")
            res = await db.execute(stmt)
            if not res.scalars().first():
                break
            i += 1
        data.slug = f"{base}-{i}"
        
    product_dict = data.model_dump()
    product_dict["tags"] = tags
    new_product = DBProduct(**product_dict)
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    # Trigger Autonomous KG Builder in the background
    if new_product.scientific_name:
        kg_job = DBKnowledgeGraphJob(
            product_id=new_product.id,
            scientific_name=new_product.scientific_name,
            status="pending"
        )
        db.add(kg_job)
        await db.commit()
        await db.refresh(kg_job)
        background_tasks.add_task(trigger_kg_blueprint_research, new_product.id, kg_job.id)
        
    return {k: v for k, v in new_product.__dict__.items() if not k.startswith('_')}


@api.get("/admin/products")
async def admin_list_products(user=Depends(require_admin), page: int = 1, limit: int = 50, search: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(DBProduct)
    if search:
        stmt = stmt.where(or_(
            DBProduct.common_name_tr.ilike(f"%{search}%"),
            DBProduct.scientific_name.ilike(f"%{search}%")
        ))
    stmt = stmt.order_by(desc(DBProduct.created_at)).offset((page-1)*limit).limit(limit)
    result = await db.execute(stmt)
    items = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in result.scalars().all()]
    
    count_stmt = select(func.count(DBProduct.id))
    if search:
        count_stmt = count_stmt.where(or_(
            DBProduct.common_name_tr.ilike(f"%{search}%"),
            DBProduct.scientific_name.ilike(f"%{search}%")
        ))
    total = (await db.execute(count_stmt)).scalar() or 0
    return {"items": items, "total": total, "page": page, "limit": limit}


@api.get("/admin/products/by-id/{product_id}")
async def admin_get_product_by_id(product_id: str, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBProduct).where(DBProduct.id == product_id))
    product_obj = result.scalars().first()
    if not product_obj:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return {k: v for k, v in product_obj.__dict__.items() if not k.startswith('_')}


@api.patch("/admin/products/{product_id}")
async def admin_update_product(product_id: str, data: ProductUpdate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    
    result = await db.execute(select(DBProduct).where(DBProduct.id == product_id))
    cur = result.scalars().first()
    if not cur:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    for key, value in update_data.items():
        setattr(cur, key, value)
        
    cur.tags = compute_tags_from_taxonomy(
        cur.category or "", cur.care_level or "", cur.light_need or "",
        cur.water_need or "", cur.size or "", bool(cur.pet_safe)
    )
    cur.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(cur)
    return {k: v for k, v in cur.__dict__.items() if not k.startswith('_')}


@api.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBProduct).where(DBProduct.id == product_id))
    cur = result.scalars().first()
    if not cur:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    await db.execute(delete(DBWishlistItem).where(DBWishlistItem.product_id == product_id))
    await db.execute(delete(DBReview).where(DBReview.product_id == product_id))
    
    await db.delete(cur)
    await db.commit()
    return {"deleted": True}


# ============================================================
# ADMIN - Stats / Orders
# ============================================================
@api.get("/admin/stats")
async def admin_stats(user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    total_products = (await db.execute(select(func.count(DBProduct.id)))).scalar() or 0
    published = (await db.execute(select(func.count(DBProduct.id)).where(DBProduct.is_published == True))).scalar() or 0
    total_orders = (await db.execute(select(func.count(DBOrder.id)))).scalar() or 0
    paid_orders = (await db.execute(select(func.count(DBOrder.id)).where(DBOrder.status == "paid"))).scalar() or 0
    today_dt = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = (await db.execute(select(func.count(DBOrder.id)).where(DBOrder.created_at >= today_dt))).scalar() or 0
    
    rev = (await db.execute(select(func.sum(DBOrder.total)).where(DBOrder.status == "paid"))).scalar() or 0.0
    return {
        "total_products": total_products, "published_products": published,
        "total_orders": total_orders, "paid_orders": paid_orders,
        "today_orders": today_orders, "total_revenue": round(rev, 2),
    }


@api.get("/admin/orders")
async def admin_list_orders(user=Depends(require_admin), page: int = 1, limit: int = 30, db: AsyncSession = Depends(get_db)):
    stmt = select(DBOrder).order_by(desc(DBOrder.created_at)).offset((page-1)*limit).limit(limit)
    result = await db.execute(stmt)
    items = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in result.scalars().all()]
    total = (await db.execute(select(func.count(DBOrder.id)))).scalar() or 0
    return {"items": items, "total": total, "page": page, "limit": limit}


@api.patch("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, data: dict, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    allowed = {"status", "notes", "tracking_code"}
    update_data = {k: v for k, v in data.items() if k in allowed}
    
    result = await db.execute(select(DBOrder).where(DBOrder.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
        
    for k, v in update_data.items():
        setattr(order, k, v)
    order.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"updated": True}


@api.get("/admin/orders/{order_id}")
async def admin_get_order(order_id: str, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBOrder).where(DBOrder.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    items_result = await db.execute(select(DBOrderItem).where(DBOrderItem.order_id == order_id))
    items = items_result.scalars().all()
    
    order_dict = {k: v for k, v in order.__dict__.items() if not k.startswith('_')}
    order_dict["items"] = [{k: v for k, v in item.__dict__.items() if not k.startswith('_')} for item in items]
    
    return order_dict

# ============================================================
# ORDERS - Public/Customer
# ============================================================
@api.post("/orders/checkout")
async def create_checkout(req: CheckoutRequest, user=Depends(optional_user), db: AsyncSession = Depends(get_db)):
    if not req.items:
        raise HTTPException(status_code=400, detail="Sepet boş")
    subtotal = sum(i.price * i.quantity for i in req.items)
    shipping = 0 if subtotal >= 500 else 39.90
    discount = 0.0
    coupon_code_final = None

    # Phase 9: Bundle / Campaign hesaplama (kuponla çakışmaz)
    bundle_discount = 0.0
    applied_campaign_ids: list[str] = []
    if req.applied_campaigns:
        bundle_res = await campaign_service.validate_and_calc_for_cart(db, req.applied_campaigns)
        bundle_discount = bundle_res.get("total_discount", 0.0)
        applied_campaign_ids = bundle_res.get("applied_campaign_ids", [])

    # Apply coupon ONLY if no bundle is active (çakışma engeli)
    if req.coupon_code and not applied_campaign_ids:
        coupon_stmt = select(DBCoupon).where(DBCoupon.code == req.coupon_code.upper().strip(), DBCoupon.is_active == True)
        coupon_result = await db.execute(coupon_stmt)
        coupon = coupon_result.scalars().first()
        if coupon:
            coupon_dict = {k: v for k, v in coupon.__dict__.items() if not k.startswith('_')}
            res = _coupon_apply(coupon_dict, subtotal)
            if res["valid"]:
                discount = res.get("discount", 0)
                if res.get("shipping_override") is not None:
                    shipping = res["shipping_override"]
                coupon_code_final = coupon.code
                # increment used_count atomically
                coupon.used_count += 1
                await db.commit()
    elif req.coupon_code and applied_campaign_ids:
        # Kupon iptal edildi: bundle önceliklidir.
        coupon_code_final = None

    total = max(0, subtotal + shipping - discount - bundle_discount)
    
    order_id = str(__import__("uuid").uuid4())
    db_order = DBOrder(
        id=order_id,
        user_id=user["user_id"] if user else None,
        email=req.email,
        subtotal=round(subtotal, 2),
        shipping=round(shipping, 2),
        discount=round(discount, 2),
        coupon_code=coupon_code_final,
        bundle_discount=round(bundle_discount, 2),
        applied_campaign_ids=applied_campaign_ids,
        total=round(total, 2),
        address=req.address.model_dump(),
        notes=req.notes
    )
    db.add(db_order)
    
    items_dicts = []
    for i in req.items:
        db_item = DBOrderItem(
            order_id=order_id,
            product_id=i.product_id,
            name=i.name,
            slug=i.slug,
            price=i.price,
            quantity=i.quantity,
            image=i.image,
            campaign_id=i.campaign_id
        )
        db.add(db_item)
        items_dicts.append(i.model_dump())
    
    await db.commit()

    # Pass dict to payment service
    doc = {k: v for k, v in db_order.__dict__.items() if not k.startswith('_')}
    doc["items"] = items_dicts

    # Iyzico
    public_url = os.environ.get("PUBLIC_URL", "")
    callback_url = f"{public_url}/api/orders/iyzico/callback?order_id={order_id}"
    pay = await payment_service.create_checkout_form(db, doc, callback_url)
    payment_url = pay.get("paymentPageUrl")
    token = pay.get("token")
    if pay.get("status") != "success" or not payment_url:
        # Mark failed
        db_order.status = "failed"
        db_order.payment_status = pay.get("status")
        await db.commit()
        raise HTTPException(status_code=400, detail=f"Ödeme oluşturulamadı: {pay.get('errorMessage', 'bilinmeyen hata')}")
    db_order.payment_ref = token
    await db.commit()
    return {
        "order_id": order_id, 
        "payment_url": payment_url, 
        "token": token, 
        "checkout_form_content": pay.get("checkoutFormContent")
    }

@api.get("/orders/iyzico/callback")
async def iyzico_callback_get(order_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """User browser is redirected here after iyzico checkout completes."""
    public_url = os.environ.get("PUBLIC_URL", "")
    # Try to retrieve final status with token saved on order
    result = await db.execute(select(DBOrder).where(DBOrder.id == order_id))
    order = result.scalars().first()
    if not order:
        return _redirect(f"{public_url}/siparis-hata")
    
    token = order.payment_ref
    if token:
        res = await payment_service.retrieve_checkout_result(db, token)
        status_ = res.get("paymentStatus") or res.get("status")
        success = (res.get("status") == "success" and res.get("paymentStatus") == "SUCCESS")
        new_status = "paid" if success else "failed"
        order.status = new_status
        order.payment_status = status_
        await db.commit()
        if success:
            try:
                order_dict = {k: v for k, v in order.__dict__.items() if not k.startswith('_')}
                await email_service.send_order_confirmation(db, order.email, {**order_dict, "status": "paid"})
            except Exception as e:
                logger.warning(f"order email failed: {e}")
            return _redirect(f"{public_url}/siparis/{order_id}")
    return _redirect(f"{public_url}/siparis-hata?order_id={order_id}")


@api.post("/orders/iyzico/callback")
async def iyzico_callback_post(order_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Iyzico POSTs token here. Process and redirect."""
    return await iyzico_callback_get(order_id, request, db)


def _redirect(url: str):
    return Response(
        content=f'<html><head><script>window.top.location.href="{url}";</script></head><body>Yönlendiriliyorsunuz...</body></html>',
        media_type="text/html"
    )


@api.get("/orders/{order_id}")
async def get_order(order_id: str, user=Depends(optional_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBOrder).where(DBOrder.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
        
    doc = {k: v for k, v in order.__dict__.items() if not k.startswith('_')}
    
    # fetch items
    items_res = await db.execute(select(DBOrderItem).where(DBOrderItem.order_id == order_id))
    doc["items"] = [{k: v for k, v in item.__dict__.items() if not k.startswith('_')} for item in items_res.scalars().all()]
    return doc


@api.get("/orders")
async def my_orders(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(DBOrder).where(DBOrder.user_id == user["user_id"]).order_by(desc(DBOrder.created_at)).limit(100)
    result = await db.execute(stmt)
    items = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in result.scalars().all()]
    return {"items": items}


# ============================================================
# WISHLIST
# ============================================================
@api.post("/wishlist/toggle")
async def wishlist_toggle(payload: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    product_id = payload.get("product_id")
    if not product_id:
        raise HTTPException(status_code=400, detail="product_id gerekli")
    
    result = await db.execute(select(DBWishlistItem).where(DBWishlistItem.user_id == user["user_id"], DBWishlistItem.product_id == product_id))
    existing = result.scalars().first()
    
    if existing:
        await db.delete(existing)
        await db.commit()
        return {"in_wishlist": False, "action": "removed"}
    
    item = DBWishlistItem(
        user_id=user["user_id"],
        product_id=product_id
    )
    db.add(item)
    await db.commit()
    return {"in_wishlist": True, "action": "added"}


@api.get("/wishlist")
async def get_wishlist(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBWishlistItem).where(DBWishlistItem.user_id == user["user_id"]).order_by(desc(DBWishlistItem.created_at)).limit(500))
    items = result.scalars().all()
    if not items:
        return {"items": [], "products": []}
    
    items_dicts = [{k: v for k, v in item.__dict__.items() if not k.startswith('_')} for item in items]
    product_ids = [w.product_id for w in items]
    
    prod_result = await db.execute(select(DBProduct).where(DBProduct.id.in_(product_ids), DBProduct.is_published == True).limit(500))
    products = [{k: v for k, v in p.__dict__.items() if not k.startswith('_')} for p in prod_result.scalars().all()]
    
    return {"items": items_dicts, "products": products}


@api.get("/wishlist/ids")
async def get_wishlist_ids(user=Depends(optional_user), db: AsyncSession = Depends(get_db)):
    if not user:
        return {"ids": []}
    result = await db.execute(select(DBWishlistItem.product_id).where(DBWishlistItem.user_id == user["user_id"]).limit(1000))
    product_ids = result.scalars().all()
    return {"ids": list(product_ids)}


# ============================================================
# REVIEWS
# ============================================================
@api.get("/products/{slug}/reviews")
async def get_product_reviews(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBReview).where(DBReview.product_slug == slug, DBReview.status == "approved").order_by(desc(DBReview.created_at)).limit(200))
    items_objs = result.scalars().all()
    items = [{k: v for k, v in i.__dict__.items() if not k.startswith('_')} for i in items_objs]
    avg = 0
    if items:
        avg = round(sum(r["rating"] for r in items) / len(items), 2)
    return {"items": items, "count": len(items), "average_rating": avg}


@api.post("/products/{slug}/reviews")
async def create_review(slug: str, data: ReviewCreate, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    product = (await db.execute(select(DBProduct).where(DBProduct.slug == slug, DBProduct.is_published == True))).scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        
    user_doc = (await db.execute(select(DBUser).where(DBUser.id == user["user_id"]))).scalars().first()
    
    rv = DBReview(
        product_id=product.id,
        product_slug=slug,
        user_id=user["user_id"],
        name=user_doc.name if user_doc else "Anonim",
        rating=data.rating,
        comment=data.comment,
        status="pending"
    )
    db.add(rv)
    await db.commit()
    await db.refresh(rv)
    return {k: v for k, v in rv.__dict__.items() if not k.startswith('_')}


@api.get("/admin/reviews")
async def admin_list_reviews(user=Depends(require_admin), status: Optional[str] = None, page: int = 1, limit: int = 50, db: AsyncSession = Depends(get_db)):
    stmt = select(DBReview)
    if status:
        stmt = stmt.where(DBReview.status == status)
    stmt = stmt.order_by(desc(DBReview.created_at)).offset((page-1)*limit).limit(limit)
    
    result = await db.execute(stmt)
    items = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in result.scalars().all()]
    
    count_stmt = select(func.count(DBReview.id))
    if status:
        count_stmt = count_stmt.where(DBReview.status == status)
    total = (await db.execute(count_stmt)).scalar() or 0
    return {"items": items, "total": total}


@api.patch("/admin/reviews/{review_id}")
async def admin_update_review(review_id: str, data: dict, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    allowed = {"status"}
    update_data = {k: v for k, v in data.items() if k in allowed}
    if "status" in update_data and update_data["status"] not in ("pending", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="Geçersiz durum")
        
    result = await db.execute(select(DBReview).where(DBReview.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="İnceleme bulunamadı")
        
    for k, v in update_data.items():
        setattr(review, k, v)
    await db.commit()
    return {"updated": True}


@api.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBReview).where(DBReview.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="İnceleme bulunamadı")
    await db.delete(review)
    await db.commit()
    return {"deleted": True}


# ============================================================
# COUPONS
# ============================================================
def _coupon_apply(coupon: dict, subtotal: float) -> dict:
    """Compute discount and shipping override for given coupon and subtotal."""
    if subtotal < (coupon.get("min_order") or 0):
        return {"valid": False, "reason": f"Minimum sepet tutarı: ₺{(coupon.get('min_order') or 0):.2f}"}
    if coupon.get("max_uses") is not None and coupon.get("used_count", 0) >= coupon["max_uses"]:
        return {"valid": False, "reason": "Bu kupon kullanım limitine ulaştı"}
    if coupon.get("valid_until"):
        try:
            vu = dateparser.parse(coupon["valid_until"])
            if vu < datetime.now(timezone.utc).replace(tzinfo=vu.tzinfo if vu.tzinfo else timezone.utc):
                return {"valid": False, "reason": "Kuponun süresi dolmuş"}
        except Exception as e:
            logger.error(f"Error parsing coupon valid_until date: {e}")
    if not coupon.get("is_active", True):
        return {"valid": False, "reason": "Bu kupon aktif değil"}

    discount = 0.0
    shipping_override = None
    ctype = coupon["type"]
    val = coupon.get("value", 0)
    if ctype == "percentage":
        discount = round(subtotal * (val / 100), 2)
    elif ctype == "fixed_amount":
        discount = round(min(val, subtotal), 2)
    elif ctype == "free_shipping":
        shipping_override = 0.0
    return {
        "valid": True,
        "discount": discount,
        "shipping_override": shipping_override,
        "coupon": {"code": coupon["code"], "type": ctype, "value": val, "description": coupon.get("description")},
    }


@api.post("/coupons/validate")
async def validate_coupon(data: CouponValidate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBCoupon).where(DBCoupon.code == data.code.upper(), DBCoupon.is_active == True))
    coupon = result.scalars().first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Kupon bulunamadı veya aktif değil")
    
    coupon_dict = {k: v for k, v in coupon.__dict__.items() if not k.startswith('_')}
    if coupon_dict.get('valid_until'):
        coupon_dict['valid_until'] = coupon_dict['valid_until'].isoformat()
    res = _coupon_apply(coupon_dict, data.subtotal)
    if not res["valid"]:
        raise HTTPException(status_code=400, detail=res["reason"])
    return res


@api.get("/admin/coupons")
async def admin_list_coupons(user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBCoupon).order_by(desc(DBCoupon.created_at)).limit(500))
    items = [{k: v for k, v in row.__dict__.items() if not k.startswith('_')} for row in result.scalars().all()]
    return {"items": items}


@api.post("/admin/coupons")
async def admin_create_coupon(data: CouponCreate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    code = data.code.upper().strip()
    result = await db.execute(select(DBCoupon).where(DBCoupon.code == code))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Bu kupon kodu zaten var")
    
    cp_data = data.model_dump()
    cp_data["code"] = code
    cp = DBCoupon(**cp_data)
    db.add(cp)
    await db.commit()
    await db.refresh(cp)
    return {k: v for k, v in cp.__dict__.items() if not k.startswith('_')}


@api.patch("/admin/coupons/{coupon_id}")
async def admin_update_coupon(coupon_id: str, data: CouponUpdate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if "code" in update_data:
        update_data["code"] = update_data["code"].upper().strip()
    
    result = await db.execute(select(DBCoupon).where(DBCoupon.id == coupon_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Kupon bulunamadı")
    for k, v in update_data.items():
        setattr(doc, k, v)
    await db.commit()
    await db.refresh(doc)
    return {k: v for k, v in doc.__dict__.items() if not k.startswith('_')}


@api.delete("/admin/coupons/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBCoupon).where(DBCoupon.id == coupon_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Kupon bulunamadı")
    await db.delete(doc)
    await db.commit()
    return {"deleted": True}


# ============================================================
# CAMPAIGNS / BUNDLES (Phase 9)
# ============================================================
@api.get("/admin/campaigns")
async def admin_list_campaigns(user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBCampaign).order_by(DBCampaign.priority.asc(), DBCampaign.created_at.desc()))
    items = []
    for c in result.scalars().all():
        d = {k: v for k, v in c.__dict__.items() if not k.startswith('_')}
        items.append(d)
    return {"items": items}


@api.post("/admin/campaigns")
async def admin_create_campaign(data: CampaignCreate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    # Validate primary product exists
    prim_res = await db.execute(select(DBProduct.id).where(DBProduct.id == data.primary_product_id))
    if not prim_res.scalar():
        raise HTTPException(status_code=400, detail="Ana ürün bulunamadı.")
    # Validate related products exist
    if data.related_product_ids:
        existing_res = await db.execute(select(DBProduct.id).where(DBProduct.id.in_(data.related_product_ids)))
        existing_ids = {row for row in existing_res.scalars().all()}
        missing = [pid for pid in data.related_product_ids if pid not in existing_ids]
        if missing:
            raise HTTPException(status_code=400, detail=f"Bağlı ürün bulunamadı: {missing}")
    # Free product validation
    if data.type == "buy_x_get_y":
        if not data.free_product_id:
            raise HTTPException(status_code=400, detail="X Al Y Ücretsiz tipi için ücretsiz ürün gerekli.")
        fp_res = await db.execute(select(DBProduct.id).where(DBProduct.id == data.free_product_id))
        if not fp_res.scalar():
            raise HTTPException(status_code=400, detail="Ücretsiz ürün bulunamadı.")
    # Type-specific value validation
    if data.type == "fixed_bundle" and (data.bundle_price is None or data.bundle_price < 0):
        raise HTTPException(status_code=400, detail="Sabit bundle fiyatı gerekli.")
    if data.type == "percentage_bundle" and (data.discount_pct is None or data.discount_pct <= 0 or data.discount_pct > 100):
        raise HTTPException(status_code=400, detail="Geçerli bir yüzde indirim girin (1-100).")
    if data.type == "fixed_amount_bundle" and (data.discount_amount is None or data.discount_amount <= 0):
        raise HTTPException(status_code=400, detail="İndirim tutarı pozitif olmalı.")
    if data.type == "quantity_break" and not data.quantity_tiers:
        raise HTTPException(status_code=400, detail="En az bir miktar kademesi tanımlayın.")

    camp_data = data.model_dump()
    camp_data["quantity_tiers"] = [t.model_dump() if hasattr(t, "model_dump") else t for t in (camp_data.get("quantity_tiers") or [])]
    camp = DBCampaign(**camp_data)
    db.add(camp)
    await db.commit()
    await db.refresh(camp)
    return {k: v for k, v in camp.__dict__.items() if not k.startswith('_')}


@api.patch("/admin/campaigns/{campaign_id}")
async def admin_update_campaign(campaign_id: str, data: CampaignUpdate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if "quantity_tiers" in update_data:
        update_data["quantity_tiers"] = [t.model_dump() if hasattr(t, "model_dump") else t for t in update_data["quantity_tiers"]]
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.execute(select(DBCampaign).where(DBCampaign.id == campaign_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı.")
    for k, v in update_data.items():
        setattr(doc, k, v)
    await db.commit()
    await db.refresh(doc)
    return {k: v for k, v in doc.__dict__.items() if not k.startswith('_')}


@api.delete("/admin/campaigns/{campaign_id}")
async def admin_delete_campaign(campaign_id: str, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBCampaign).where(DBCampaign.id == campaign_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı.")
    await db.delete(doc)
    await db.commit()
    return {"deleted": True}


# ============================================================
# CAMPAIGNS / BUNDLES (Phase 9)
# ============================================================
@api.get("/admin/campaigns")
async def admin_list_campaigns(user=Depends(require_admin)):
    cursor = db.campaigns.find({}, {"_id": 0}).sort([("priority", 1), ("created_at", -1)])
    items = await cursor.to_list(length=500)
    return {"items": items}


@api.post("/admin/campaigns")
async def admin_create_campaign(data: CampaignCreate, user=Depends(require_admin)):
    # Validate primary product exists
    prim = await db.products.find_one({"id": data.primary_product_id}, {"_id": 0, "id": 1})
    if not prim:
        raise HTTPException(status_code=400, detail="Ana ürün bulunamadı.")
    # Validate related products exist
    if data.related_product_ids:
        existing = await db.products.find({"id": {"$in": data.related_product_ids}}, {"_id": 0, "id": 1}).to_list(length=100)
        existing_ids = {p["id"] for p in existing}
        missing = [pid for pid in data.related_product_ids if pid not in existing_ids]
        if missing:
            raise HTTPException(status_code=400, detail=f"Bağlı ürün bulunamadı: {missing}")
    # Free product validation
    if data.type == "buy_x_get_y":
        if not data.free_product_id:
            raise HTTPException(status_code=400, detail="X Al Y Ücretsiz tipi için ücretsiz ürün gerekli.")
        fp = await db.products.find_one({"id": data.free_product_id}, {"_id": 0, "id": 1})
        if not fp:
            raise HTTPException(status_code=400, detail="Ücretsiz ürün bulunamadı.")
    # Type-specific value validation
    if data.type == "fixed_bundle" and (data.bundle_price is None or data.bundle_price < 0):
        raise HTTPException(status_code=400, detail="Sabit bundle fiyatı gerekli.")
    if data.type == "percentage_bundle" and (data.discount_pct is None or data.discount_pct <= 0 or data.discount_pct > 100):
        raise HTTPException(status_code=400, detail="Geçerli bir yüzde indirim girin (1-100).")
    if data.type == "fixed_amount_bundle" and (data.discount_amount is None or data.discount_amount <= 0):
        raise HTTPException(status_code=400, detail="İndirim tutarı pozitif olmalı.")
    if data.type == "quantity_break" and not data.quantity_tiers:
        raise HTTPException(status_code=400, detail="En az bir miktar kademesi tanımlayın.")

    camp = Campaign(**data.model_dump())
    doc = camp.model_dump()
    doc["quantity_tiers"] = [t.model_dump() if hasattr(t, "model_dump") else t for t in (doc.get("quantity_tiers") or [])]
    await db.campaigns.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/admin/campaigns/{campaign_id}")
async def admin_update_campaign(campaign_id: str, data: CampaignUpdate, user=Depends(require_admin)):
    update = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if "quantity_tiers" in update:
        update["quantity_tiers"] = [t.model_dump() if hasattr(t, "model_dump") else t for t in update["quantity_tiers"]]
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    r = await db.campaigns.update_one({"id": campaign_id}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı.")
    doc = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    return doc


@api.delete("/admin/campaigns/{campaign_id}")
async def admin_delete_campaign(campaign_id: str, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBCampaign).where(DBCampaign.id == campaign_id))
    camp = result.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı.")
    await db.delete(camp)
    await db.commit()
    return {"deleted": True}


@api.get("/campaigns/for-product/{product_id}")
async def get_campaigns_for_product(product_id: str, db: AsyncSession = Depends(get_db)):
    """Public: ürün detay sayfası için canlı kampanyaları döndürür (hidratlı)."""
    camps = await campaign_service.fetch_campaigns_for_product(db, product_id)
    out = []
    for c in camps:
        enriched = await campaign_service.hydrate_campaign_products(db, c)
        out.append(enriched)
    return {"items": out}


@api.post("/campaigns/calculate")
async def calculate_campaign(req: BundleCalcRequest, db: AsyncSession = Depends(get_db)):
    """Frontend bundle özet hesaplaması için. Sepet kontrolü değil, sadece anlık hesap."""
    result = await db.execute(select(DBCampaign).where(DBCampaign.id == req.campaign_id))
    camp_obj = result.scalars().first()
    if not camp_obj:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı.")
    camp = {k: v for k, v in camp_obj.__dict__.items() if not k.startswith('_')}
    
    # Ürün fiyatlarını çek
    products = {}
    if req.selected_product_ids:
        prod_res = await db.execute(select(DBProduct).where(DBProduct.id.in_(req.selected_product_ids)))
        for p in prod_res.scalars().all():
            products[p.id] = {k: v for k, v in p.__dict__.items() if not k.startswith('_')}
            
    selected = []
    for pid in req.selected_product_ids:
        prod = products.get(pid)
        if not prod:
            continue
        selected.append({"id": pid, "price": prod.get("price", 0), "quantity": 1})
    res = campaign_service.calculate_bundle(camp, selected)
    return res


# ============================================================
# BLOG
# ============================================================
@api.get("/blog")
async def list_blog(page: int = 1, limit: int = 12, tag: Optional[str] = None, search: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(DBBlogPost).where(DBBlogPost.status == "published")
    if tag:
        stmt = stmt.where(cast(DBBlogPost.tags, String).ilike(f'%"{tag}"%'))
    if search:
        stmt = stmt.where(or_(
            DBBlogPost.title.ilike(f"%{search}%"),
            cast(DBBlogPost.content, String).ilike(f"%{search}%")
        ))
    
    stmt = stmt.order_by(desc(DBBlogPost.published_at)).offset((page-1)*limit).limit(limit)
    result = await db.execute(stmt)
    
    # Exclude content
    items = []
    for row in result.scalars().all():
        d = {k: v for k, v in row.__dict__.items() if not k.startswith('_')}
        d.pop("content", None)
        items.append(d)
        
    count_stmt = select(func.count(DBBlogPost.id)).where(DBBlogPost.status == "published")
    if tag:
        count_stmt = count_stmt.where(cast(DBBlogPost.tags, String).ilike(f'%"{tag}"%'))
    total = (await db.execute(count_stmt)).scalar() or 0
    return {"items": items, "total": total, "page": page, "limit": limit, "pages": (total + limit - 1) // limit}


@api.get("/blog/{slug}")
async def get_blog(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBBlogPost).where(DBBlogPost.slug == slug, DBBlogPost.status == "published"))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Yazı bulunamadı")
        
    # Increment views
    post.view_count += 1
    await db.commit()
    
    doc = {k: v for k, v in post.__dict__.items() if not k.startswith('_')}
    
    # Related posts
    rel_stmt = select(DBBlogPost).where(DBBlogPost.status == "published", DBBlogPost.slug != slug).order_by(desc(DBBlogPost.published_at)).limit(3)
    rel_res = await db.execute(rel_stmt)
    related = []
    for r in rel_res.scalars().all():
        d = {k: v for k, v in r.__dict__.items() if not k.startswith('_')}
        d.pop("content", None)
        related.append(d)
        
    # Related products
    related_products = []
    rpi = doc.get("related_product_ids") or []
    if rpi:
        rp_stmt = select(DBProduct).where(DBProduct.id.in_(rpi), DBProduct.is_published == True).limit(20)
        rp_res = await db.execute(rp_stmt)
        related_products = [{k: v for k, v in p.__dict__.items() if not k.startswith('_')} for p in rp_res.scalars().all()]
        
    return {"post": doc, "related": related, "related_products": related_products}


@api.get("/blog-tags")
async def blog_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBBlogPost.tags).where(DBBlogPost.status == "published"))
    tag_counts = {}
    for row in result.scalars().all():
        for tag in (row or []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
    sorted_tags = sorted([{"tag": k, "count": v} for k, v in tag_counts.items()], key=lambda x: x["count"], reverse=True)[:30]
    return {"items": sorted_tags}


@api.get("/blog-recent")
async def blog_recent(limit: int = 5, db: AsyncSession = Depends(get_db)):
    stmt = select(DBBlogPost).where(DBBlogPost.status == "published").order_by(desc(DBBlogPost.published_at)).limit(limit)
    result = await db.execute(stmt)
    items = []
    for row in result.scalars().all():
        d = {k: v for k, v in row.__dict__.items() if not k.startswith('_')}
        d.pop("content", None)
        items.append(d)
    return {"items": items}


# Admin product search (for selectors)
@api.get("/admin/products/search")
async def admin_product_search(q: str = "", limit: int = 20, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    stmt = select(
        DBProduct.id, DBProduct.common_name_tr, DBProduct.scientific_name, 
        DBProduct.slug, DBProduct.images, DBProduct.price
    )
    if q:
        stmt = stmt.where(or_(
            DBProduct.common_name_tr.ilike(f"%{q}%"),
            DBProduct.scientific_name.ilike(f"%{q}%"),
            DBProduct.slug.ilike(f"%{q}%")
        ))
    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    items = []
    for row in result.all():
        items.append({
            "id": row.id,
            "common_name_tr": row.common_name_tr,
            "scientific_name": row.scientific_name,
            "slug": row.slug,
            "images": row.images,
            "price": row.price
        })
    return {"items": items}


@api.post("/admin/products/{product_id}/images")
async def admin_replace_product_image(product_id: str, file: UploadFile = File(...), user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Replace product images list with a single new image (legacy)."""
    result = await db.execute(select(DBProduct).where(DBProduct.id == product_id))
    cur = result.scalars().first()
    if not cur:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    contents = await file.read()
    img = optimize_and_save(contents)
    new_image = {"main": img["main"], "thumb": img["thumb"], "alt": cur.common_name_tr or ""}
    
    cur.images = [new_image]
    cur.updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    return {k: v for k, v in cur.__dict__.items() if not k.startswith('_')}


@api.post("/admin/products/{product_id}/images/add")
async def admin_add_product_image(product_id: str, file: UploadFile = File(...), generate_alt: Optional[bool] = Form(False), user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Append a new image to the product's gallery. Optionally generates AI alt text."""
    result = await db.execute(select(DBProduct).where(DBProduct.id == product_id))
    cur = result.scalars().first()
    if not cur:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    contents = await file.read()
    img = optimize_and_save(contents)
    name = cur.common_name_tr or "Bitki"
    existing = list(cur.images or [])
    # Default alt: name + index
    alt_text = f"{name} - Ürün Görseli {len(existing) + 1}"
    if generate_alt:
        try:
            ai = ai_service.generate_taxonomy_with_mistral_sync(
                contents,
                {"scientific_name": cur.scientific_name, "common_names": [name], "family": "", "score": 0},
                (await ai_service._keys(db))["mistral"],
                product_name=name,
            )
            if ai.get("alt_text"):
                alt_text = ai["alt_text"][:125]
        except Exception as e:
            logger.warning(f"alt gen failed: {e}")
    new_image = {"main": img["main"], "thumb": img["thumb"], "alt": alt_text}
    existing.append(new_image)
    
    cur.images = existing
    cur.updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    doc = {k: v for k, v in cur.__dict__.items() if not k.startswith('_')}
    return {"product": doc, "image": new_image}


@api.delete("/admin/products/{product_id}/images/{index}")
async def admin_delete_product_image(product_id: str, index: int, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBProduct).where(DBProduct.id == product_id))
    cur = result.scalars().first()
    if not cur:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    imgs = list(cur.images or [])
    if index < 0 or index >= len(imgs):
        raise HTTPException(status_code=400, detail="Geçersiz görsel indeksi")
    imgs.pop(index)
    
    cur.images = imgs
    cur.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {k: v for k, v in cur.__dict__.items() if not k.startswith('_')}


@api.patch("/admin/products/{product_id}/images/{index}/alt")
async def admin_update_image_alt(product_id: str, index: int, data: dict, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBProduct).where(DBProduct.id == product_id))
    cur = result.scalars().first()
    if not cur:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    imgs = list(cur.images or [])
    if index < 0 or index >= len(imgs):
        raise HTTPException(status_code=400, detail="Geçersiz görsel indeksi")
    alt = (data.get("alt") or "")[:200]
    imgs[index]["alt"] = alt
    
    cur.images = imgs
    cur.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {k: v for k, v in cur.__dict__.items() if not k.startswith('_')}


@api.post("/admin/products/{product_id}/images/reorder")
async def admin_reorder_product_images(product_id: str, data: dict, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Reorder images. data = { order: [int, int, ...] (indices in new order) }"""
    result = await db.execute(select(DBProduct).where(DBProduct.id == product_id))
    cur = result.scalars().first()
    if not cur:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    imgs = list(cur.images or [])
    order = data.get("order") or []
    if sorted(order) != list(range(len(imgs))):
        raise HTTPException(status_code=400, detail="Geçersiz sıralama")
    new_imgs = [imgs[i] for i in order]
    
    cur.images = new_imgs
    cur.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {k: v for k, v in cur.__dict__.items() if not k.startswith('_')}


# ============================================================
# CHAT - Yaver
# ============================================================
@api.post("/chat")
async def chat_yaver(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    ctx = dict(req.context or {})
    if ctx.get("product_slug"):
        p_res = await db.execute(select(DBProduct).where(DBProduct.slug == ctx["product_slug"]))
        p = p_res.scalars().first()
        if p:
            ctx["product"] = {k: v for k, v in p.__dict__.items() if not k.startswith('_')}
    if ctx.get("order_id"):
        o_res = await db.execute(select(DBOrder).where(DBOrder.id == ctx["order_id"]))
        o = o_res.scalars().first()
        if o:
            ctx["order"] = {k: v for k, v in o.__dict__.items() if not k.startswith('_')}
    try:
        out = await ai_service.chat_with_yaver(req.message, db, history=req.history, context=ctx)
        return out
    except Exception:
        logger.exception("Chat failed")
        return {"reply": "Üzgünüm, şu an yanıt veremiyorum. Lütfen birazdan tekrar deneyin.", "suggestions": []}


# ============================================================
# SETTINGS
# ============================================================
@api.get("/settings/menu")
async def public_settings_menu(db: AsyncSession = Depends(get_db)):
    return await settings_service.public_menu(db)


@api.get("/admin/settings")
async def admin_get_settings(user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    return await settings_service.settings_to_admin_view(db)


@api.patch("/admin/settings/api-keys")
async def admin_update_api_keys(data: APIKeysUpdate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Güncellenecek alan yok")
        
    result = await db.execute(select(DBSettings).where(DBSettings.key == "global"))
    setting = result.scalars().first()
    if not setting:
        setting = DBSettings(key="global", value={})
        db.add(setting)
        
    val = copy.deepcopy(setting.value) if setting.value else {}
    if "api_keys" not in val:
        val["api_keys"] = {}
    for k, v in update_data.items():
        val["api_keys"][k] = v
        
    await db.execute(update(DBSettings).where(DBSettings.key == "global").values(value=val))
    await db.commit()
    settings_service.clear_cache()
    return {"updated": True, "fields": list(update_data.keys())}


@api.patch("/admin/settings/menu")
async def admin_update_menu(data: MenuUpdate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Güncellenecek alan yok")
        
    result = await db.execute(select(DBSettings).where(DBSettings.key == "global"))
    setting = result.scalars().first()
    if not setting:
        setting = DBSettings(key="global", value={})
        db.add(setting)
        
    import copy
    val = copy.deepcopy(setting.value) if setting.value else {}
    if "menu" not in val:
        val["menu"] = {}
    for k, v in update_data.items():
        val["menu"][k] = v
        
    await db.execute(update(DBSettings).where(DBSettings.key == "global").values(value=val))
    await db.commit()
    settings_service.clear_cache()
    return {"updated": True}


@api.patch("/admin/settings/general")
async def admin_update_general(data: GeneralUpdate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Güncellenecek alan yok")
        
    result = await db.execute(select(DBSettings).where(DBSettings.key == "global"))
    setting = result.scalars().first()
    if not setting:
        setting = DBSettings(key="global", value={})
        db.add(setting)
        
    import copy
    val = copy.deepcopy(setting.value) if setting.value else {}
    if "general" not in val:
        val["general"] = {}
    for k, v in update_data.items():
        val["general"][k] = v
        
    await db.execute(update(DBSettings).where(DBSettings.key == "global").values(value=val))
    await db.commit()
    settings_service.clear_cache()
    return {"updated": True}


@api.patch("/admin/settings/general")
async def admin_update_general(data: GeneralUpdate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    update = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Güncellenecek alan yok")
        
    result = await db.execute(select(DBSettings).where(DBSettings.key == "global"))
    setting = result.scalars().first()
    if not setting:
        setting = DBSettings(key="global", value={})
        db.add(setting)
        
    import copy
    from sqlalchemy.orm.attributes import flag_modified
    
    val = copy.deepcopy(setting.value) if setting.value else {}
    if "general" not in val:
        val["general"] = {}
    for k, v in update.items():
        val["general"][k] = v
    setting.value = val
    flag_modified(setting, "value")
    await db.commit()
    settings_service.clear_cache()
    return {"updated": True}


@api.get("/settings/templates")
async def get_storefront_templates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSettings).where(DBSettings.key == "storefront_templates"))
    setting = result.scalars().first()
    if not setting:
        return {}
    return setting.value

class StorefrontTemplateUpdate(BaseModel):
    templates: dict

@api.post("/admin/settings/templates")
async def admin_update_storefront_templates(data: StorefrontTemplateUpdate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSettings).where(DBSettings.key == "storefront_templates"))
    setting = result.scalars().first()
    if not setting:
        setting = DBSettings(key="storefront_templates", value=data.templates)
        db.add(setting)
    else:
        setting.value = data.templates
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(setting, "value")
    await db.commit()
    settings_service.clear_cache()
    return {"updated": True, "templates": setting.value}

class HeroContentUpdate(BaseModel):
    content: dict

@api.get("/settings/hero")
async def get_public_hero_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSettings).where(DBSettings.key == "hero_content"))
    setting = result.scalars().first()
    return setting.value if setting else {}

@api.get("/admin/settings/hero")
async def admin_get_hero_settings(user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSettings).where(DBSettings.key == "hero_content"))
    setting = result.scalars().first()
    return setting.value if setting else {}

@api.post("/admin/settings/hero")
async def admin_update_hero_settings(data: HeroContentUpdate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSettings).where(DBSettings.key == "hero_content"))
    setting = result.scalars().first()
    if not setting:
        setting = DBSettings(key="hero_content", value=data.content)
        db.add(setting)
    else:
        setting.value = data.content
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(setting, "value")
    await db.commit()
    return {"updated": True, "content": setting.value}


class HeroOptimizeRequest(BaseModel):
    variant: str
    base_context: dict

@api.post("/admin/ai/hero-optimize")
async def admin_optimize_hero(data: HeroOptimizeRequest, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    from ai_service import optimize_hero_content
    result = await optimize_hero_content(data.variant, data.base_context, db)
    return {"success": True, "optimized_content": result}

@api.get("/admin/blog")
async def admin_list_blog(user=Depends(require_admin), status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(DBBlogPost)
    if status:
        stmt = stmt.where(DBBlogPost.status == status)
    stmt = stmt.order_by(desc(DBBlogPost.created_at))
    
    result = await db.execute(stmt)
    items = []
    for row in result.scalars().all():
        d = {k: v for k, v in row.__dict__.items() if not k.startswith('_')}
        d.pop("content", None)
        items.append(d)
        
    return {"items": items, "total": len(items)}


@api.get("/admin/blog/{post_id}")
async def admin_get_blog(post_id: str, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBBlogPost).where(DBBlogPost.id == post_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Yazı bulunamadı")
    return {k: v for k, v in post.__dict__.items() if not k.startswith('_')}


@api.post("/admin/blog")
async def admin_create_blog(data: BlogPostCreate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBBlogPost).where(DBBlogPost.slug == data.slug))
    if result.scalars().first():
        base = data.slug
        i = 2
        while True:
            res = await db.execute(select(DBBlogPost).where(DBBlogPost.slug == f"{base}-{i}"))
            if not res.scalars().first():
                break
            i += 1
        data.slug = f"{base}-{i}"
        
    post_data = data.model_dump()
    if post_data.get("status") == "published":
        post_data["published_at"] = datetime.now(timezone.utc)
        
    post = DBBlogPost(**post_data)
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return {k: v for k, v in post.__dict__.items() if not k.startswith('_')}


@api.patch("/admin/blog/{post_id}")
async def admin_update_blog(post_id: str, data: BlogPostUpdate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    
    result = await db.execute(select(DBBlogPost).where(DBBlogPost.id == post_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Yazı bulunamadı")
        
    if update_data.get("status") == "published" and not post.published_at:
        post.published_at = datetime.now(timezone.utc)
        
    for k, v in update_data.items():
        setattr(post, k, v)
        
    post.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(post)
    return {k: v for k, v in post.__dict__.items() if not k.startswith('_')}


@api.delete("/admin/blog/{post_id}")
async def admin_delete_blog(post_id: str, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBBlogPost).where(DBBlogPost.id == post_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Yazı bulunamadı")
    await db.delete(post)
    await db.commit()
    return {"deleted": True}


# Generic media upload (admin)
@api.post("/admin/media/upload")
async def admin_media_upload(file: UploadFile = File(...), user=Depends(require_admin)):
    contents = await file.read()
    img = optimize_and_save(contents)
    return {"url": img["main"], "thumb": img["thumb"]}

# Upload cover image for blog (admin)
@api.post("/admin/blog/upload-image")
async def admin_blog_upload_image(file: UploadFile = File(...), user=Depends(require_admin)):
    contents = await file.read()
    img = optimize_and_save(contents)
    return {"url": img["main"], "thumb": img["thumb"]}


# ============================================================
# SEO
# ============================================================
@api.get("/seo/sitemap.xml")
async def sitemap(db: AsyncSession = Depends(get_db)):
    base = os.environ.get("PUBLIC_URL", "").rstrip("/")
    urls = [f"{base}/", f"{base}/sepet", f"{base}/giris", f"{base}/kayit", f"{base}/blog"]
    # Landing pages
    for slug in LANDING_PAGES.keys():
        urls.append(f"{base}/k/{slug}")
        
    # Products
    prod_stmt = select(DBProduct.slug, DBProduct.updated_at).where(DBProduct.is_published == True).limit(10000)
    prod_res = await db.execute(prod_stmt)
    products = [{"slug": row.slug, "updated_at": row.updated_at.isoformat() if row.updated_at else ""} for row in prod_res.all()]
    
    # Blog posts
    blog_stmt = select(DBBlogPost.slug, DBBlogPost.updated_at).where(DBBlogPost.status == "published").limit(10000)
    blog_res = await db.execute(blog_stmt)
    posts = [{"slug": row.slug, "updated_at": row.updated_at.isoformat() if row.updated_at else ""} for row in blog_res.all()]
    
    body = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        body.append(f"<url><loc>{u}</loc></url>")
    for p in products:
        body.append(f"<url><loc>{base}/u/{p['slug']}</loc><lastmod>{p.get('updated_at','')[:10]}</lastmod></url>")
    for p in posts:
        body.append(f"<url><loc>{base}/blog/{p['slug']}</loc><lastmod>{p.get('updated_at','')[:10]}</lastmod></url>")
    body.append("</urlset>")
    return Response(content="\n".join(body), media_type="application/xml")


@api.get("/seo/robots.txt")
async def robots():
    base = os.environ.get("PUBLIC_URL", "").rstrip("/")
    txt = f"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\nSitemap: {base}/api/seo/sitemap.xml\n"
    return Response(content=txt, media_type="text/plain")


# ============================================================
# MEDIA (serve uploaded webp)
# ============================================================
@api.get("/media/products/{filename}")
async def get_product_image(filename: str):
    p = MEDIA_ROOT / "products" / filename
    if not p.exists():
        raise HTTPException(status_code=404)
    return FileResponse(p, media_type="image/webp", headers={"Cache-Control": "public, max-age=31536000, immutable"})


@api.get("/media/thumbs/{filename}")
async def get_thumb_image(filename: str):
    p = MEDIA_ROOT / "thumbs" / filename
    if not p.exists():
        raise HTTPException(status_code=404)
    return FileResponse(p, media_type="image/webp", headers={"Cache-Control": "public, max-age=31536000, immutable"})

@api.get("/media/theme-component/{path:path}")
async def get_theme_component_image(path: str):
    p = MEDIA_ROOT / "theme-component" / path
    if not p.exists():
        raise HTTPException(status_code=404)
    return FileResponse(p, media_type="image/png", headers={"Cache-Control": "public, max-age=31536000, immutable"})


# ============================================================
# Mount
# ============================================================
app.include_router(api)
app.include_router(knowledge_graph.router, prefix="/api")
app.include_router(seo_engine.router)
app.include_router(exa_router.router)

cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_credentials="*" not in cors_origins,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# STARTUP: seed admin + demo user
# ============================================================
@app.on_event("startup")
async def startup_seed():
    from database import init_db
    await init_db()
    
    async with AsyncSessionLocal() as session:
        # Seed admin user
        admin_email = "admin@yesildukkan.com"
        res = await session.execute(select(DBUser).where(DBUser.email == admin_email))
        if not res.scalars().first():
            u = DBUser(email=admin_email, name="Admin", role="admin", password_hash=hash_password("Admin1234!"))
            session.add(u)
            logger.info("Seeded admin user")
            
        # Seed demo user
        demo_email = "demo@yesildukkan.com"
        res = await session.execute(select(DBUser).where(DBUser.email == demo_email))
        if not res.scalars().first():
            u = DBUser(email=demo_email, name="Demo", role="customer", password_hash=hash_password("Demo1234!"))
            session.add(u)
            logger.info("Seeded demo user")
            
        await session.commit()
    # Note: indexes are managed by SQLAlchemy migrations or metadata.create_all()

@app.on_event("shutdown")
async def shutdown_db_client():
    from database import engine
    await engine.dispose()
