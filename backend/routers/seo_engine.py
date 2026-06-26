from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import db_models
import os
import requests
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import BackgroundTasks
from ai_service import _keys
import models
import json

MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_MODEL = "mistral-large-latest"

router = APIRouter(prefix="/api/seo", tags=["seo"])

class AITextRequest(BaseModel):
    text: str
    context: str = ""

class AnalyzeRequest(BaseModel):
    topic: str

async def _call_exa(query: str, db: AsyncSession) -> dict:
    keys = await _keys(db)
    exa_key = keys.get("exa")
    if not exa_key:
        raise HTTPException(status_code=500, detail="Exa API key is not configured")
    
    headers = {
        "x-api-key": exa_key,
        "Content-Type": "application/json"
    }
    
    schema = {
        "type": "object",
        "description": "Semantic SEO analysis of the topic",
        "required": ["entities", "faqs", "gaps"],
        "properties": {
            "entities": {
                "type": "array",
                "description": "Important SEO entities, concepts, and keywords that must be included",
                "items": {"type": "string"}
            },
            "faqs": {
                "type": "array",
                "description": "Most common questions asked by users about this topic",
                "items": {"type": "string"}
            },
            "gaps": {
                "type": "array",
                "description": "Common content gaps or missed sub-topics by competitors",
                "items": {"type": "string"}
            }
        }
    }
    
    payload = {
        "query": f"best comprehensive articles and guides about {query}",
        "type": "deep",
        "systemPrompt": "Analyze the top search results to extract key SEO entities, frequently asked questions, and content gaps. Output valid JSON adhering to the provided schema.",
        "outputSchema": schema,
        "contents": {
            "highlights": True
        }
    }
    
    try:
        r = requests.post("https://api.exa.ai/search", json=payload, headers=headers, timeout=30)
        r.raise_for_status()
        data = r.json()
        return data.get("output", {}).get("content", {"entities": [], "faqs": [], "gaps": []})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _call_mistral(prompt: str, db: AsyncSession) -> str:
    keys = await _keys(db)
    mistral_key = keys.get("mistral")
    if not mistral_key:
        raise HTTPException(status_code=500, detail="Mistral API key is not configured")
    
    headers = {
        "Authorization": f"Bearer {mistral_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MISTRAL_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    
    try:
        r = requests.post(MISTRAL_URL, json=payload, headers=headers, timeout=90)
        r.raise_for_status()
        data = r.json()
        content = data["choices"][0]["message"]["content"]
        import re
        cleaned = re.sub(r"^```(?:html)?\s*|\s*```$", "", content.strip(), flags=re.MULTILINE)
        return cleaned
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def _call_mistral_json(prompt: str, db: AsyncSession) -> dict:
    keys = await _keys(db)
    mistral_key = keys.get("mistral")
    if not mistral_key:
        raise HTTPException(status_code=500, detail="Mistral API key is not configured")
    
    headers = {
        "Authorization": f"Bearer {mistral_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MISTRAL_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "response_format": {"type": "json_object"}
    }
    
    try:
        r = requests.post(MISTRAL_URL, json=payload, headers=headers, timeout=90)
        r.raise_for_status()
        data = r.json()
        content = data["choices"][0]["message"]["content"]
        import re
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.MULTILINE)
        return json.loads(cleaned)
    except Exception as e:
        import logging
        logging.error(f"MISTRAL ERROR details: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai-rewrite")
async def ai_rewrite(req: AITextRequest, db: AsyncSession = Depends(get_db)):
    prompt = f"Rewrite the following text to make it more engaging and professional. Preserve the original language and tone. ONLY output valid HTML markup. Do not use Markdown. Use <p>, <strong>, <em>, <ul>, <li> tags to format the text without any conversational filler.\n\nContext: {req.context}\n\nText:\n{req.text}"
    result = await _call_mistral(prompt, db)
    return {"result": result}

@router.post("/ai-expand")
async def ai_expand(req: AITextRequest, db: AsyncSession = Depends(get_db)):
    prompt = f"Expand the following text by adding more detail, explanations, and depth. Preserve the original language. ONLY output valid HTML markup. Do not use Markdown. Use <p>, <strong>, <em>, <ul>, <li> tags to format the text without any conversational filler.\n\nContext: {req.context}\n\nText:\n{req.text}"
    result = await _call_mistral(prompt, db)
    return {"result": result}

@router.post("/ai-summarize")
async def ai_summarize(req: AITextRequest, db: AsyncSession = Depends(get_db)):
    prompt = f"Summarize the following text into a concise and clear version. Preserve the original language. ONLY output valid HTML markup. Do not use Markdown. Use <p>, <strong>, <em>, <ul>, <li> tags to format the text without any conversational filler.\n\nText:\n{req.text}"
    result = await _call_mistral(prompt, db)
    return {"result": result}

@router.post("/analyze-topic")
async def analyze_topic(req: AnalyzeRequest, db: AsyncSession = Depends(get_db)):
    result = await _call_exa(req.topic, db)
    return result

class SuggestLinksRequest(BaseModel):
    text: str

@router.post("/suggest-links")
async def suggest_links(req: SuggestLinksRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch available internal links (products and published blogs)
    products = []
    products_result = await db.execute(select(db_models.DBProduct.common_name_tr, db_models.DBProduct.slug))
    for p in products_result.all():
        products.append({"title": p[0] or p[1], "url": f"/urun/{p[1]}"})

    blogs_result = await db.execute(select(db_models.DBBlogPost.title, db_models.DBBlogPost.slug).where(db_models.DBBlogPost.status == "published"))
    blogs = [{"title": b[0], "url": f"/blog/{b[1]}"} for b in blogs_result.all()]

    all_links = products + blogs
    links_json = json.dumps(all_links, ensure_ascii=False)

    prompt = f"""You are an advanced SEO Internal Linking assistant.
I will give you a list of available internal pages on our site, and a draft text.
Your task is to identify relevant keywords/phrases in the text and suggest linking them to the appropriate internal pages.

Available Internal Pages:
{links_json}

Draft Text:
{req.text}

Return a JSON object strictly following this structure:
{{
  "suggestions": [
    {{
      "anchor_text": "the exact phrase from the text to be linked",
      "target_url": "the URL of the internal page to link to",
      "reason": "Brief explanation of why this link is relevant"
    }}
  ]
}}
Only return the JSON.
"""
    result = await _call_mistral_json(prompt, db)
    return result

@router.get("/knowledge-graph")
async def knowledge_graph(db: AsyncSession = Depends(get_db)):
    # Build a graph of covered entities based on tags and categories
    graph = {"categories": {}, "tags": {}}
    
    # Products
    products = await db.execute(select(db_models.DBProduct.category, db_models.DBProduct.tags))
    for p in products.all():
        cat = p[0]
        tags = p[1] or []
        if cat not in graph["categories"]:
            graph["categories"][cat] = 0
        graph["categories"][cat] += 1
        for t in tags:
            if t not in graph["tags"]:
                graph["tags"][t] = 0
            graph["tags"][t] += 1

    # Blogs
    blogs = await db.execute(select(db_models.DBBlogPost.tags))
    for b in blogs.all():
        tags = b[0] or []
        for t in tags:
            if t not in graph["tags"]:
                graph["tags"][t] = 0
            graph["tags"][t] += 1

    # Sort tags by frequency
    sorted_tags = sorted(graph["tags"].items(), key=lambda x: x[1], reverse=True)
    graph["tags"] = {k: v for k, v in sorted_tags}

    # Taxonomies and species
    families = await db.execute(select(db_models.DBTaxonomyFamily.name))
    genera = await db.execute(select(db_models.DBTaxonomyGenus.name))
    species = await db.execute(select(db_models.DBSpecies.scientific_name))
    diseases = await db.execute(select(db_models.DBDisease.name))

    graph["taxonomies"] = {
        "families": [f[0] for f in families.all()],
        "genera": [g[0] for g in genera.all()],
        "species": [s[0] for s in species.all()],
        "diseases": [d[0] for d in diseases.all()]
    }

    return graph

class FindGapsRequest(BaseModel):
    covered_topics: list[str]

@router.post("/find-gaps")
async def find_gaps(req: FindGapsRequest, db: AsyncSession = Depends(get_db)):
    topics_str = ", ".join(req.covered_topics)
    prompt = f"""You are an expert SEO Strategist in the botany and plant care niche (specifically succulents, cacti, and house plants).
Our site currently covers these topics/tags: {topics_str}.

Analyze the topical authority map and identify missing clusters, concepts, or specific plant guides that we need to write to achieve complete topical authority.

IMPORTANT: All your suggestions, cluster names, and missing topic ideas MUST be in Turkish language (Türkçe).

Return a JSON object strictly following this structure:
{{
  "gaps": [
    {{
      "cluster": "Geniş konu kümesi (örneğin: Zararlı Kontrolü ve Hastalıklar)",
      "missing_topics": ["Spesifik makale fikri 1", "Spesifik makale fikri 2"]
    }}
  ]
}}
"""
    result = await _call_mistral_json(prompt, db)
    return result

@router.get("/kg-jobs")
async def kg_jobs(db: AsyncSession = Depends(get_db)):
    # Fetch recent 20 jobs
    stmt = select(db_models.DBKnowledgeGraphJob).order_by(db_models.DBKnowledgeGraphJob.updated_at.desc()).limit(20)
    result = await db.execute(stmt)
    jobs = result.scalars().all()
    
    out = []
    for j in jobs:
        out.append({
            "id": j.id,
            "product_id": j.product_id,
            "scientific_name": j.scientific_name,
            "status": j.status,
            "error_message": j.error_message,
            "updated_at": j.updated_at.isoformat() if j.updated_at else None
        })
    return out

@router.post("/manual-scan")
async def manual_scan(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # Find all products that have scientific_name but no species_slug
    stmt = select(db_models.DBProduct).where(
        db_models.DBProduct.scientific_name != None,
        db_models.DBProduct.scientific_name != "",
        db_models.DBProduct.species_slug == None
    )
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    queued = 0
    from kg_agent import trigger_kg_blueprint_research
    
    if products:
        product_ids = [p.id for p in products]

        # Batch fetch existing jobs for these products
        job_stmt = select(db_models.DBKnowledgeGraphJob.product_id).where(
            db_models.DBKnowledgeGraphJob.product_id.in_(product_ids),
            db_models.DBKnowledgeGraphJob.status.in_(["pending", "researching", "idle"])
        )
        job_res = await db.execute(job_stmt)
        existing_job_product_ids = set(job_res.scalars().all())
        
        for p in products:
            if p.id in existing_job_product_ids:
                continue # already queued

            kg_job = db_models.DBKnowledgeGraphJob(
                product_id=p.id,
                scientific_name=p.scientific_name,
                status="idle"
            )
            db.add(kg_job)
            await db.commit()
            await db.refresh(kg_job)

            queued += 1
        
    return {"message": f"{queued} adet taranmamış ürün listeye eklendi.", "queued_count": queued}

@router.post("/trigger-job/{job_id}")
async def trigger_job(job_id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    stmt = select(db_models.DBKnowledgeGraphJob).where(db_models.DBKnowledgeGraphJob.id == job_id)
    res = await db.execute(stmt)
    job = res.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.status = "pending"
    await db.commit()
    
    from kg_agent import trigger_kg_blueprint_research
    background_tasks.add_task(trigger_kg_blueprint_research, job.product_id, job.id)
    return {"message": "Araştırma başlatıldı."}

@router.post("/cancel-job/{job_id}")
async def cancel_job(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(db_models.DBKnowledgeGraphJob).where(db_models.DBKnowledgeGraphJob.id == job_id)
    res = await db.execute(stmt)
    job = res.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.status = "failed"
    job.error_message = "Kullanıcı tarafından iptal edildi."
    await db.commit()
    return {"message": "Araştırma iptal edildi."}

@router.post("/clear-failed-jobs")
async def clear_failed_jobs(db: AsyncSession = Depends(get_db)):
    stmt = select(db_models.DBKnowledgeGraphJob).where(db_models.DBKnowledgeGraphJob.status == "failed")
    res = await db.execute(stmt)
    failed_jobs = res.scalars().all()
    count = len(failed_jobs)
    for j in failed_jobs:
        await db.delete(j)
    await db.commit()
    return {"message": f"{count} adet hatalı kayıt temizlendi."}
