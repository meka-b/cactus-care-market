import os
import json
import logging
import requests
from typing import Dict, Any

logger = logging.getLogger(__name__)

MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

def generate_category_metadata_sync(category_name: str, category_type: str, mistral_key: str) -> Dict[str, Any]:
    if not mistral_key:
        raise ValueError("Mistral API anahtarı tanımlı değil")

    prompt = f"""Sen bir E-ticaret platformu ("Yeşil Dükkan") için kategori yöneticisisin. 
"{category_name}" isimli bir {category_type} kategorisi (örneğin Ürün, Blog, Koleksiyon veya Filtre) için uygun meta verileri üretmelisin.

Lütfen SADECE aşağıdaki formata uygun geçerli bir JSON objesi dön:
{{
  "seo_title": "string (50-60 karakter, SEO uyumlu)",
  "seo_description": "string (150-160 karakter, harekete geçirici mesaj içeren açıklama)",
  "geo_targeting": "string (Örn: TR, Türkiye, Istanbul)",
  "llm_prompt": "string (RAG asistanları için bu kategoriye dair 2-3 cümlelik yönlendirme komutu)",
  "serp_keywords": ["keyword1", "keyword2", "keyword3"] (ilgili 5-8 adet anahtar kelime)
}}

Açıklamaları ve başlıkları e-ticaret dönüşümü yüksek (kaktüs, bitki bakımı vs. bağlamına uygun) şekilde hazırla."""

    headers = {
        "Authorization": f"Bearer {mistral_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "pixtral-large-latest",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"}
    }

    try:
        res = requests.post(MISTRAL_URL, headers=headers, json=payload, timeout=45)
        res.raise_for_status()
        content = res.json()["choices"][0]["message"]["content"]
        data = json.loads(content)
        return data
    except Exception as e:
        logger.error(f"Category generation failed: {e}")
        raise ValueError(f"AI category generation failed: {str(e)}")
