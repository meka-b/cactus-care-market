from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from exa_service import (
    fetch_url_content_tr,
    generate_page_tr,
    generate_social_tr,
    generate_ad_tr
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/exa", tags=["Exa AI Admin"])

class FetchUrlRequest(BaseModel):
    url: str
    query: str = ""

class GeneratePageRequest(BaseModel):
    topic: str
    variant: str = "Listicle"

class GenerateSocialRequest(BaseModel):
    topic: str
    variant: str = "LinkedIn"

class GenerateAdRequest(BaseModel):
    topic: str
    variant: str = "LinkedIn Sponsored"

@router.post("/fetch-url")
async def fetch_url(req: FetchUrlRequest, db: AsyncSession = Depends(get_db)):
    try:
        res = await fetch_url_content_tr(req.url, req.query, db)
        return {"success": True, "data": res}
    except Exception as e:
        logger.exception("Exa Fetch URL error")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-page")
async def generate_page(req: GeneratePageRequest, db: AsyncSession = Depends(get_db)):
    try:
        res = await generate_page_tr(req.topic, req.variant, db)
        return {"success": True, "data": res}
    except Exception as e:
        logger.exception("Exa Generate Page error")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-social")
async def generate_social(req: GenerateSocialRequest, db: AsyncSession = Depends(get_db)):
    try:
        res = await generate_social_tr(req.topic, req.variant, db)
        return {"success": True, "data": res}
    except Exception as e:
        logger.exception("Exa Generate Social error")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-ad")
async def generate_ad(req: GenerateAdRequest, db: AsyncSession = Depends(get_db)):
    try:
        res = await generate_ad_tr(req.topic, req.variant, db)
        return {"success": True, "data": res}
    except Exception as e:
        logger.exception("Exa Generate Ad error")
        raise HTTPException(status_code=500, detail=str(e))
