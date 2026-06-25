import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from database import get_db
from db_models import DBTaxonomyFamily, DBTaxonomyGenus, DBSpecies, DBDisease, DBProduct
from models import TaxonomyFamilyCreate, TaxonomyGenusCreate, SpeciesCreate, DiseaseCreate, TaxonomyFamily, TaxonomyGenus, Species, Disease
from auth import require_admin
import plant_id_service

router = APIRouter(prefix="/kg", tags=["Knowledge Graph"])

# --- TaxonomyFamily ---
@router.post("/families", response_model=TaxonomyFamily)
async def create_family(data: TaxonomyFamilyCreate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBTaxonomyFamily).where(DBTaxonomyFamily.slug == data.slug))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    fam = DBTaxonomyFamily(**data.model_dump())
    db.add(fam)
    await db.commit()
    await db.refresh(fam)
    return {k: v for k, v in fam.__dict__.items() if not k.startswith('_')}

@router.get("/families/{slug}")
async def get_family(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBTaxonomyFamily).where(DBTaxonomyFamily.slug == slug))
    fam = result.scalars().first()
    if not fam:
        raise HTTPException(status_code=404, detail="Family not found")
        
    doc = {k: v for k, v in fam.__dict__.items() if not k.startswith('_')}
    
    genuses_res = await db.execute(select(DBTaxonomyGenus).where(DBTaxonomyGenus.family_slug == slug))
    doc["genuses"] = [{k: v for k, v in g.__dict__.items() if not k.startswith('_')} for g in genuses_res.scalars().all()]
    
    return doc

@router.get("/families")
async def list_families(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBTaxonomyFamily))
    return [{"slug": f.slug, "name": f.name} for f in result.scalars().all()]

# --- TaxonomyGenus ---
@router.post("/genuses", response_model=TaxonomyGenus)
async def create_genus(data: TaxonomyGenusCreate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBTaxonomyGenus).where(DBTaxonomyGenus.slug == data.slug))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    gen = DBTaxonomyGenus(**data.model_dump())
    db.add(gen)
    await db.commit()
    await db.refresh(gen)
    return {k: v for k, v in gen.__dict__.items() if not k.startswith('_')}

@router.get("/genuses/{slug}")
async def get_genus(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBTaxonomyGenus).where(DBTaxonomyGenus.slug == slug))
    gen = result.scalars().first()
    if not gen:
        raise HTTPException(status_code=404, detail="Genus not found")
        
    doc = {k: v for k, v in gen.__dict__.items() if not k.startswith('_')}
    
    species_res = await db.execute(select(DBSpecies).where(DBSpecies.genus_slug == slug))
    doc["species"] = [{k: v for k, v in s.__dict__.items() if not k.startswith('_')} for s in species_res.scalars().all()]
    
    return doc

@router.get("/genuses")
async def list_genuses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBTaxonomyGenus))
    return [{"slug": g.slug, "name": g.name, "family_slug": g.family_slug} for g in result.scalars().all()]

# --- Species ---
@router.post("/species", response_model=Species)
async def create_species(data: SpeciesCreate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSpecies).where(DBSpecies.slug == data.slug))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    sp = DBSpecies(**data.model_dump())
    db.add(sp)
    await db.commit()
    await db.refresh(sp)
    return {k: v for k, v in sp.__dict__.items() if not k.startswith('_')}

@router.get("/species/{slug}")
async def get_species(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSpecies).where(DBSpecies.slug == slug))
    sp = result.scalars().first()
    if not sp:
        raise HTTPException(status_code=404, detail="Species not found")
    
    doc = {k: v for k, v in sp.__dict__.items() if not k.startswith('_')}
    
    # Fetch related products
    prod_res = await db.execute(select(DBProduct).where(DBProduct.species_slug == slug, DBProduct.is_published == True))
    doc["products"] = [{k: v for k, v in p.__dict__.items() if not k.startswith('_')} for p in prod_res.scalars().all()]
    
    # Fetch diseases with their proper names
    if doc.get("diseases_slugs") and len(doc["diseases_slugs"]) > 0:
        dis_res = await db.execute(select(DBDisease).where(DBDisease.slug.in_(doc["diseases_slugs"])))
        doc["diseases"] = [{"slug": d.slug, "name": d.name} for d in dis_res.scalars().all()]
    else:
        doc["diseases"] = []
    
    return doc

@router.get("/species")
async def list_species(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSpecies))
    return [{"slug": s.slug, "scientific_name": s.scientific_name, "common_names": s.common_names} for s in result.scalars().all()]

# --- Disease ---
@router.post("/diseases", response_model=Disease)
async def create_disease(data: DiseaseCreate, user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBDisease).where(DBDisease.slug == data.slug))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    dis = DBDisease(**data.model_dump())
    db.add(dis)
    await db.commit()
    await db.refresh(dis)
    return {k: v for k, v in dis.__dict__.items() if not k.startswith('_')}

@router.get("/diseases/{slug}")
async def get_disease(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBDisease).where(DBDisease.slug == slug))
    dis = result.scalars().first()
    if not dis:
        raise HTTPException(status_code=404, detail="Disease not found")
    return {k: v for k, v in dis.__dict__.items() if not k.startswith('_')}

@router.get("/diseases")
async def list_diseases(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBDisease))
    return [{"slug": d.slug, "name": d.name} for d in result.scalars().all()]

# --- Plant.id Identification ---
@router.post("/identify")
async def identify_plant_image(file: UploadFile = File(...)):
    """
    Kullanıcının yüklediği görseli plant.id API'sine gönderir ve sonuçları döner.
    """
    contents = await file.read()
    b64_str = base64.b64encode(contents).decode("utf-8")
    
    # Send image encoded as data URI for Plant.id v3
    data_uri = f"data:{file.content_type};base64,{b64_str}"
    
    result = await plant_id_service.identify_plant([data_uri])
    return result
