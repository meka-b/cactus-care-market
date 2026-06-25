import os
import json
import re
import requests
from typing import Dict, Any, List
from ai_service import _keys, MISTRAL_URL

def _translate_to_turkish(text: str, mistral_key: str, context_hint: str = "") -> str:
    """Translate and rewrite the text into professional, SEO-friendly Turkish using Mistral."""
    if not mistral_key:
        raise ValueError("Mistral API anahtarı tanımlı değil.")
        
    prompt = f"""Aşağıdaki metni (veya JSON verisini) profesyonel, SEO uyumlu ve akıcı bir Türkçe ile çevir ve düzenle.
Kullanılacak dil tonu: Profesyonel, bilgi verici, saygılı (Siz/Biz).
Bağlam/İpucu: {context_hint}

Metin:
{text}

SADECE çevrilmiş/düzenlenmiş içeriği döndür. Ekstra açıklama, giriş veya sonuç cümleleri ekleme. Eğer giriş metni JSON ise, aynı yapıda JSON döndür ancak değerleri Türkçe olsun."""

    headers = {"Authorization": f"Bearer {mistral_key}", "Content-Type": "application/json"}
    payload = {
        "model": "mistral-large-latest",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 4000,
    }
    
    # 90 seconds timeout as requested
    r = requests.post(MISTRAL_URL, headers=headers, json=payload, timeout=90)
    r.raise_for_status()
    
    body = r.json()
    content = body["choices"][0]["message"]["content"].strip()
    
    if context_hint.startswith("JSON"):
        content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.MULTILINE)
        
    return content

async def fetch_url_content_tr(url: str, query: str, db) -> Dict[str, Any]:
    keys = await _keys(db)
    if not keys["exa"]:
        raise ValueError("Exa API anahtarı tanımlı değil.")
        
    from exa_py import Exa
    exa = Exa(api_key=keys["exa"])
    
    kwargs = {"urls": [url]}
    if query:
        kwargs["highlights"] = {"query": query}
    else:
        kwargs["highlights"] = True
        
    result = exa.get_contents(**kwargs)
    
    if not result.results:
        raise ValueError("Belirtilen URL'den içerik çekilemedi.")
        
    page = result.results[0]
    
    raw_text = page.highlights[0] if page.highlights else (page.text or "")
    if not raw_text:
        raw_text = "İçerik bulunamadı."
        
    translated_text = _translate_to_turkish(raw_text, keys["mistral"], context_hint="Makale/Blog İçeriği Özeti")
    
    return {
        "title": page.title,
        "url": page.url,
        "content_tr": translated_text
    }

async def generate_page_tr(topic: str, variant: str, db) -> Dict[str, Any]:
    keys = await _keys(db)
    if not keys["exa"]:
        raise ValueError("Exa API anahtarı tanımlı değil.")
        
    from exa_py import Exa
    exa = Exa(api_key=keys["exa"])
    
    if variant == "FAQ":
        system_prompt = f"Generate a programmatic SEO FAQ page targeting {topic}. Return question and answer pairs."
        output_schema = {
            "type": "object",
            "required": ["faqs"],
            "properties": {
                "faqs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {"question": {"type": "string"}, "answer": {"type": "string"}}
                    }
                }
            }
        }
    else:
        system_prompt = f"Generate a programmatic SEO listicle or guide targeting {topic}. Rank or detail real products/concepts by fit. Plain prose, grounded claims."
        output_schema = {
            "type": "object",
            "required": ["metaTitle", "intro", "items", "faqs"],
            "properties": {
                "metaTitle": {"type": "string"},
                "intro": {"type": "string"},
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "summary": {"type": "string"},
                        }
                    }
                },
                "faqs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {"question": {"type": "string"}, "answer": {"type": "string"}}
                    }
                }
            }
        }
        
    result = exa.search(
        f"Research the best options, facts, and details for: {topic}.",
        type="deep",
        num_results=5,
        system_prompt=system_prompt,
        output_schema=output_schema,
        contents={"highlights": True}
    )
    
    raw_json = json.dumps(result.output.content, ensure_ascii=False)
    translated_json_str = _translate_to_turkish(raw_json, keys["mistral"], context_hint="JSON: Programmatic SEO Page Content")
    
    try:
        translated_content = json.loads(translated_json_str)
    except Exception:
        translated_content = {"raw": translated_json_str}
        
    citations = [{"title": getattr(g, 'title', None), "url": getattr(g, 'url', None)} for g in getattr(result.output, "grounding", [])]
    
    return {
        "content_tr": translated_content,
        "citations": citations
    }

async def generate_social_tr(topic: str, variant: str, db) -> Dict[str, Any]:
    keys = await _keys(db)
    if not keys["exa"]:
        raise ValueError("Exa API anahtarı tanımlı değil.")
        
    from exa_py import Exa
    exa = Exa(api_key=keys["exa"])
    
    if variant == "Tweet":
        system_prompt = f"Draft a Tweet for an operator in the {topic} space. Max 280 characters. Anchor to one recent event. Voice rules: punchy, no clichés."
        output_schema = {"type": "object", "properties": {"tweet": {"type": "string"}}, "required": ["tweet"]}
    elif variant == "Thread":
        system_prompt = f"Draft a Twitter thread about {topic} based on recent debates. 3-5 tweets. Hook, details, conclusion."
        output_schema = {"type": "object", "properties": {"tweets": {"type": "array", "items": {"type": "string"}}}, "required": ["tweets"]}
    else:
        system_prompt = f"Draft a LinkedIn post for an operator in the {topic} space. 140-220 words. Anchor to one recent event. Voice: professional, no clichés."
        output_schema = {
            "type": "object",
            "required": ["hook", "paragraphs", "kicker"],
            "properties": {
                "hook": {"type": "string"},
                "paragraphs": {"type": "array", "items": {"type": "string"}},
                "kicker": {"type": "string"},
            }
        }
        
    result = exa.search(
        f"What are people in {topic} actually arguing about or launching right now? Find recent posts from the last 30 days.",
        type="deep",
        num_results=5,
        system_prompt=system_prompt,
        output_schema=output_schema,
        contents={"highlights": True}
    )
    
    raw_json = json.dumps(result.output.content, ensure_ascii=False)
    translated_json_str = _translate_to_turkish(raw_json, keys["mistral"], context_hint="JSON: Social Media Post")
    
    try:
        translated_content = json.loads(translated_json_str)
    except Exception:
        translated_content = {"raw": translated_json_str}
        
    citations = [{"title": getattr(g, 'title', None), "url": getattr(g, 'url', None)} for g in getattr(result.output, "grounding", [])]

    return {
        "content_tr": translated_content,
        "citations": citations
    }

async def generate_ad_tr(topic: str, variant: str, db) -> Dict[str, Any]:
    keys = await _keys(db)
    if not keys["exa"]:
        raise ValueError("Exa API anahtarı tanımlı değil.")
        
    from exa_py import Exa
    exa = Exa(api_key=keys["exa"])
    
    if variant == "Google":
        output_schema = {
            "type": "object",
            "required": ["headlines", "descriptions"],
            "properties": {
                "headlines": {"type": "array", "items": {"type": "string", "description": "Max 30 chars"}},
                "descriptions": {"type": "array", "items": {"type": "string", "description": "Max 90 chars"}}
            }
        }
    elif variant == "Meta":
        output_schema = {
            "type": "object",
            "required": ["primaryText", "headline", "description", "cta"],
            "properties": {
                "primaryText": {"type": "string"},
                "headline": {"type": "string"},
                "description": {"type": "string"},
                "cta": {"type": "string"}
            }
        }
    else:
        output_schema = {
            "type": "object",
            "required": ["audienceInsight", "introText", "headline", "description", "cta"],
            "properties": {
                "audienceInsight": {"type": "string"},
                "introText": {"type": "string", "description": "Max 150 chars"},
                "headline": {"type": "string", "description": "Max 70 chars"},
                "description": {"type": "string", "description": "Max 100 chars"},
                "cta": {"type": "string"}
            }
        }
        
    result = exa.search(
        f'What specific professional pain points and proof points around "{topic}" do decision-makers care about right now?',
        type="deep",
        num_results=5,
        system_prompt=f'Draft a {variant} ad for "{topic}". Use real audience language from the sources. Return requested fields.',
        output_schema=output_schema,
        contents={"highlights": True}
    )
    
    raw_json = json.dumps(result.output.content, ensure_ascii=False)
    translated_json_str = _translate_to_turkish(raw_json, keys["mistral"], context_hint="JSON: Ad Copy")
    
    try:
        translated_content = json.loads(translated_json_str)
    except Exception:
        translated_content = {"raw": translated_json_str}
        
    citations = [{"title": getattr(g, 'title', None), "url": getattr(g, 'url', None)} for g in getattr(result.output, "grounding", [])]

    return {
        "content_tr": translated_content,
        "citations": citations
    }
