import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from exa_py import Exa

from database import AsyncSessionLocal
from db_models import DBProduct, DBTaxonomyFamily, DBTaxonomyGenus, DBSpecies, DBDisease, DBKnowledgeGraphJob
from ai_service import _keys, MISTRAL_URL
import requests
import re
import unicodedata

def slugify(text: str) -> str:
    text = text.lower()
    text = text.replace("ı", "i").replace("ö", "o").replace("ü", "u").replace("ş", "s").replace("ğ", "g").replace("ç", "c")
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

logger = logging.getLogger(__name__)

async def trigger_kg_blueprint_research(product_id: str, job_id: str):
    """Background task to run the autonomous KG Agent on a product."""
    try:
        async with AsyncSessionLocal() as db:
            await _run_agent(product_id, job_id, db)
    except Exception as e:
        logger.exception(f"Autonomous KG Agent failed for product {product_id}: {e}")
        async with AsyncSessionLocal() as db:
            job = await db.get(DBKnowledgeGraphJob, job_id)
            if job:
                job.status = "failed"
                job.error_message = str(e)
                await db.commit()

async def _run_agent(product_id: str, job_id: str, db: AsyncSession):
    # Fetch job
    job = await db.get(DBKnowledgeGraphJob, job_id)
    if not job:
        return

    job.status = "researching"
    await db.commit()

    # 1. Fetch the product
    stmt = select(DBProduct).where(DBProduct.id == product_id)
    result = await db.execute(stmt)
    product = result.scalars().first()
    
    if not product or not product.scientific_name:
        logger.info("Product not found or lacks scientific_name.")
        return
        
    sci_name = product.scientific_name
    # Clean the name to create a base slug
    base_slug = slugify(sci_name)
    
    # 2. Check if species already exists
    stmt = select(DBSpecies).where(DBSpecies.slug == base_slug)
    result = await db.execute(stmt)
    existing_species = result.scalars().first()
    
    if existing_species:
        # Already exists, just link it
        product.species_slug = existing_species.slug
        job.status = "completed"
        await db.commit()
        return

    # 3. Retrieve API Keys
    keys = await _keys(db)
    if not keys.get("exa") or not keys.get("mistral"):
        logger.error("Missing EXA or Mistral keys for KG Agent.")
        job.status = "failed"
        job.error_message = "Missing API keys"
        await db.commit()
        return
        
    exa = Exa(api_key=keys["exa"])
    
    # 4. Use Exa.ai to research based on blueprint
    try:
        exa_res = exa.search_and_contents(
            f"Comprehensive botanical and care info for {sci_name} plant taxonomy care diseases FAQ",
            type="neural",
            num_results=3,
            text=True
        )
        
        # Combine the texts from the top results
        combined_text = ""
        for res in exa_res.results:
            combined_text += f"Source: {res.url}\nText: {res.text[:3000]}\n\n"
            
    except Exception as e:
        logger.error(f"Exa search failed for {sci_name}: {e}")
        job.status = "failed"
        job.error_message = f"Exa error: {e}"
        await db.commit()
        return

    # 5. Translate & Refine with Mistral
    mistral_prompt = f"""Aşağıdaki web tarama sonuçlarını kullanarak '{sci_name}' bitkisi için detaylı ve profesyonel bir botanik profili oluştur.
Çıktı SADECE aşağıdaki JSON formatında ve TÜRKÇE olmalıdır:
{{
  "taxonomy": {{"family": "...", "genus": "..."}},
  "description": "...",
  "etymology": "...",
  "care_guide": {{"light": "...", "water": "...", "temperature": "...", "humidity": "...", "toxicity": "...", "growth_rate": "..."}},
  "diseases": [{{"name": "...", "symptoms": ["..."], "treatment": "..."}}],
  "faqs": [{{"question": "...", "answer": "..."}}]
}}

Web Verileri:
{combined_text}
"""

    headers = {"Authorization": f"Bearer {keys['mistral']}", "Content-Type": "application/json"}
    payload = {
        "model": "mistral-large-latest",
        "messages": [{"role": "user", "content": mistral_prompt}],
        "temperature": 0.2,
        "max_tokens": 4000,
        "response_format": {"type": "json_object"}
    }
    
    r = requests.post(MISTRAL_URL, headers=headers, json=payload, timeout=120)
    if not r.ok:
        logger.error(f"Mistral translation failed: {r.text}")
        job.status = "failed"
        job.error_message = "Mistral translation failed"
        await db.commit()
        return
        
    try:
        content = r.json()["choices"][0]["message"]["content"]
        tr_data = json.loads(content)
    except Exception as e:
        logger.error(f"Failed to parse Mistral JSON: {e}")
        job.status = "failed"
        job.error_message = "Failed to parse Mistral output"
        await db.commit()
        return

    # 6. Save to Database
    tax = tr_data.get("taxonomy", {})
    fam_name = tr_data.get("taxonomy", {}).get("family", "Bilinmeyen Familya")
    gen_name = tr_data.get("taxonomy", {}).get("genus", "Bilinmeyen Cins")
    
    fam_slug = slugify(fam_name)
    gen_slug = slugify(gen_name)
    
    # Ensure Family
    res = await db.execute(select(DBTaxonomyFamily).where(DBTaxonomyFamily.slug == fam_slug))
    if not res.scalars().first():
        db.add(DBTaxonomyFamily(slug=fam_slug, name=fam_name))
        
    # Ensure Genus
    res = await db.execute(select(DBTaxonomyGenus).where(DBTaxonomyGenus.slug == gen_slug))
    if not res.scalars().first():
        db.add(DBTaxonomyGenus(slug=gen_slug, name=gen_name, family_slug=fam_slug))
        
    # Create Diseases
    disease_slugs = []
    for d in tr_data.get("diseases", []):
        d_name = d.get("name", "Bilinmeyen Hastalık")
        d_slug = slugify(d_name)
        res = await db.execute(select(DBDisease).where(DBDisease.slug == d_slug))
        disease_obj = res.scalars().first()
        if not disease_obj:
            disease_obj = DBDisease(
                slug=d_slug,
                name=d_name,
                description=d.get("treatment", ""),
                symptoms=d.get("symptoms", []),
                treatment=d.get("treatment", "")
            )
            db.add(disease_obj)
        disease_slugs.append(d_slug)

    # Create Species
    new_species = DBSpecies(
        slug=base_slug,
        scientific_name=sci_name,
        common_names=product.tags, # using tags as fallback for common_names
        family_slug=fam_slug,
        genus_slug=gen_slug,
        description=tr_data.get("description", ""),
        etymology=tr_data.get("etymology", ""),
        care_guide=tr_data.get("care_guide", {}),
        faqs=tr_data.get("faqs", []),
        diseases_slugs=disease_slugs
    )
    db.add(new_species)
    
    # Link Product
    product.species_slug = base_slug
    job.status = "completed"
    await db.commit()
    logger.info(f"Successfully generated Knowledge Graph for {sci_name}.")
