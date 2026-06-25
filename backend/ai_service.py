"""PlantNet + Mistral Pixtral integration. API keys can be overridden via DB settings."""
import os
import base64
import json
import re
import logging
import requests
from typing import Dict, Optional
from constants import CATEGORIES, CARE_LEVELS, LIGHT_NEEDS, WATER_NEEDS, SIZES, compute_tags_from_taxonomy

logger = logging.getLogger(__name__)

MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_MODEL = "pixtral-large-latest"


async def _keys(db) -> Dict[str, str]:
    """Resolve API keys from DB (settings) with ENV fallback."""
    try:
        from settings_service import get_api_key
        plantnet = await get_api_key(db, "plantnet")
        mistral = await get_api_key(db, "mistral")
        exa = await get_api_key(db, "exa")
    except Exception:
        plantnet = os.environ.get("PLANTNET_API_KEY", "")
        mistral = os.environ.get("MISTRAL_API_KEY", "")
        exa = os.environ.get("EXA_API_KEY", "")

    return {
        "plantnet": plantnet,
        "mistral": mistral,
        "exa": exa
    }


def identify_with_plantnet_sync(image_bytes: bytes, plantnet_key: str, filename: str = "plant.jpg") -> Dict:
    if not plantnet_key:
        raise ValueError("PlantNet API anahtarı tanımlı değil")
    url = f"https://my-api.plantnet.org/v2/identify/all?api-key={plantnet_key}"
    files = [("images", (filename, image_bytes, "image/jpeg"))]
    data = {"organs": "auto"}
    r = requests.post(url, files=files, data=data, timeout=60)
    r.raise_for_status()
    data = r.json()
    results = data.get("results", [])
    if not results:
        return {"scientific_name": None, "common_names": [], "score": 0}
    top = results[0]
    species = top.get("species", {})
    return {
        "scientific_name": species.get("scientificNameWithoutAuthor"),
        "scientific_name_full": species.get("scientificName"),
        "common_names": species.get("commonNames", []),
        "genus": (species.get("genus") or {}).get("scientificNameWithoutAuthor"),
        "family": (species.get("family") or {}).get("scientificNameWithoutAuthor"),
        "score": round(top.get("score", 0), 3),
    }


def _build_prompt(plantnet: dict, product_name: str = "") -> str:
    common = ", ".join(plantnet.get("common_names", [])[:3]) or "bilinmiyor"
    name_hint = ""
    if product_name:
        name_hint = f"\nADMIN VERILEN TR AD: \"{product_name}\" — common_name_tr bu olsun, slug bundan türetilsin."
    return f"""Sen Yeşil Dükkan adlı Türkçe bir bitki e-ticaret platformu için ürün taksonomi üreten bir asistansın.

Bu bitki için (PlantNet: scientific_name="{plantnet.get('scientific_name')}", family="{plantnet.get('family')}", common_names="{common}"), SADECE GEÇERLİ JSON döndür.
{name_hint}

Şema:
{{
  "scientific_name":"string",
  "common_name_tr":"string",
  "slug":"string (ASCII, tire-li)",
  "category":"string ({', '.join(CATEGORIES)})",
  "care_level":"string ({' / '.join(CARE_LEVELS)})",
  "light_need":"string ({' / '.join(LIGHT_NEEDS)})",
  "water_need":"string ({' / '.join(WATER_NEEDS)})",
  "size":"string ({' / '.join(SIZES)})",
  "pet_safe":"boolean",
  "short_description":"string ≤160 char TR",
  "description":"string 200-400 kelime TR paragraflı",
  "care_tips":["5 madde TR"],
  "alt_text":"string TR ≤125 char",
  "meta_title":"string 50-60 char TR",
  "meta_description":"string 140-160 char TR"
}}

KURALLAR: SADECE JSON; enum'lar listeden; slug ASCII; kaktüsler dikenli=false; Aloe/Sukulent çoğunlukla true."""


def generate_taxonomy_with_mistral_sync(image_bytes: bytes, plantnet: dict, mistral_key: str, product_name: str = "") -> Dict:
    if not mistral_key:
        raise ValueError("Mistral API anahtarı tanımlı değil")
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{b64}"
    headers = {"Authorization": f"Bearer {mistral_key}", "Content-Type": "application/json"}
    payload = {
        "model": MISTRAL_MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": _build_prompt(plantnet, product_name)},
                {"type": "image_url", "image_url": data_url},
            ],
        }],
        "temperature": 0.2,
        "max_tokens": 2000,
        "response_format": {"type": "json_object"},
    }
    r = requests.post(MISTRAL_URL, headers=headers, json=payload, timeout=120)
    r.raise_for_status()
    body = r.json()
    content = body["choices"][0]["message"]["content"]
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.MULTILINE)
    ai = json.loads(cleaned)
    ai["tags"] = compute_tags_from_taxonomy(
        ai.get("category", ""), ai.get("care_level", ""), ai.get("light_need", ""),
        ai.get("water_need", ""), ai.get("size", ""), bool(ai.get("pet_safe", False))
    )
    return ai


async def sync_plant_data(images_bytes: list[bytes], current_data: dict, db) -> Dict:
    keys = await _keys(db)
    if not keys["mistral"]:
        raise ValueError("Mistral API anahtarı tanımlı değil")
        
    messages_content = []
    
    # 1) Add images
    for img_bytes in images_bytes:
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{b64}"
        messages_content.append({"type": "image_url", "image_url": data_url})
        
    # 2) Build prompt with current data
    prompt = f"""Sen Yeşil Dükkan adlı Türkçe bir bitki e-ticaret platformu için ürün taksonomi üreten bir asistansın.
Kullanıcı formu kısmen doldurmuş olabilir. Görevin, GÖRSELLERE ve mevcut verilere bakarak formu eksiksiz bir şekilde JSON olarak tamamlamaktır.

MEVCUT FORM VERİLERİ (Aşağıdaki alanlar boş ("") veya "0" vb ise sen dolduracaksın, dolu ise değiştirmeden veya mantıklıysa ufak rötuşlarla koruyacaksın):
{json.dumps(current_data, ensure_ascii=False, indent=2)}

SADECE GEÇERLİ JSON DÖNDÜR.
Şema:
{{
  "scientific_name":"string",
  "common_name_tr":"string",
  "slug":"string (ASCII, tire-li)",
  "category":"string ({', '.join(CATEGORIES)})",
  "care_level":"string ({' / '.join(CARE_LEVELS)})",
  "light_need":"string ({' / '.join(LIGHT_NEEDS)})",
  "water_need":"string ({' / '.join(WATER_NEEDS)})",
  "size":"string ({' / '.join(SIZES)})",
  "pet_safe":"boolean",
  "short_description":"string ≤160 char TR",
  "description":"string 200-400 kelime TR paragraflı (zaten varsa koru)",
  "care_tips":["5 madde TR"],
  "meta_title":"string 50-60 char TR",
  "meta_description":"string 140-160 char TR",
  "alt_texts": ["string", "string"] // (Yüklenen HER BİR görsel için ayrı sırayla birer alt text olmalıdır.)
}}

KURALLAR: SADECE JSON. Kategori ve bakım seviyeleri kesinlikle yukarıdaki listeden biri olmalı. Slug tireli ve küçük harf olmalı. alt_texts dizisindeki eleman sayısı, yüklenen görsel sayısına eşit olmalıdır.
"""
    messages_content.append({"type": "text", "text": prompt})
    
    headers = {"Authorization": f"Bearer {keys['mistral']}", "Content-Type": "application/json"}
    payload = {
        "model": MISTRAL_MODEL,
        "messages": [{"role": "user", "content": messages_content}],
        "temperature": 0.2,
        "max_tokens": 3000,
        "response_format": {"type": "json_object"},
    }
    
    r = requests.post(MISTRAL_URL, headers=headers, json=payload, timeout=120)
    r.raise_for_status()
    
    body = r.json()
    content = body["choices"][0]["message"]["content"]
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.MULTILINE)
    ai = json.loads(cleaned)
    
    # Re-compute tags
    ai["tags"] = compute_tags_from_taxonomy(
        ai.get("category", ""), ai.get("care_level", ""), ai.get("light_need", ""),
        ai.get("water_need", ""), ai.get("size", ""), bool(ai.get("pet_safe", False))
    )
    
    return ai


async def analyze_plant_image(image_bytes: bytes, db, product_name: str = "") -> Dict:
    keys = await _keys(db)
    plant = identify_with_plantnet_sync(image_bytes, keys["plantnet"])
    if not plant.get("scientific_name"):
        if not product_name:
            raise ValueError("Bitki tanımlanamadı. Lütfen daha net bir bitki fotoğrafı yükleyin veya ürün adı belirtin.")
        plant = {"scientific_name": product_name, "common_names": [product_name], "family": "", "score": 0}
    ai = generate_taxonomy_with_mistral_sync(image_bytes, plant, keys["mistral"], product_name)
    ai["plantnet_score"] = plant.get("score", 0)
    ai["common_names"] = plant.get("common_names", [])
    return ai


async def generate_blog_seo(title: str, db, excerpt: str = "", target_keywords: str = "") -> Dict:
    keys = await _keys(db)
    if not keys["mistral"]:
        raise ValueError("Mistral API anahtarı tanımlı değil")
    headers = {"Authorization": f"Bearer {keys['mistral']}", "Content-Type": "application/json"}
    prompt = f"""Sen Yeşil Dükkan adlı Türkçe bitki e-ticaret blog platformu için SEO uzmanısın.

Blog yazısı için SEO önerilerini SADECE JSON olarak döndür.

BLOG BAŞLIĞI: {title}
ÖZET: {excerpt or "(boş)"}
HEDEF KELİMELER: {target_keywords or "(otomatik belirle)"}

Şema:
{{
  "meta_title":"string 50-60 char TR",
  "meta_description":"string 140-160 char TR CTR'yi artıracak",
  "slug":"string ASCII tire-li",
  "tags":["3-6 etiket ASCII tire-li"],
  "hook":"string giriş paragrafı 2-3 cümle TR",
  "outline":["5-7 alt başlık önerisi TR"],
  "target_keyword":"string ana SEO anahtar"
}}
SADECE JSON."""
    payload = {
        "model": "mistral-large-latest",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 1200,
        "response_format": {"type": "json_object"},
    }
    r = requests.post(MISTRAL_URL, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    body = r.json()
    content = body["choices"][0]["message"]["content"]
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)


async def chat_with_yaver(message: str, db, history: Optional[list] = None, context: Optional[dict] = None) -> Dict:
    """Yaver chatbot: bitki bakımı + ürün + sipariş desteği + RAG."""
    keys = await _keys(db)
    if not keys["mistral"]:
        return {"reply": "Üzgünüm, AI asistan şu anda yapılandırılmamış. Lütfen yöneticiye bildirin.", "suggestions": []}

    # Fetch RAG context
    import rag_service
    search_query = message
    if history:
        last_user_msgs = [m.get("content", "") for m in history[-4:] if m.get("role") == "user"]
        if last_user_msgs:
            search_query = f"{last_user_msgs[-1]} {message}"
            
    rag_results = await rag_service.search_rag(search_query, db, top_k=3)
    rag_context = "\n".join([r["content"] for r in rag_results])
    
    system_prompt = f"""Sen Yaver'sin — Yeşil Dükkan'ın yapay zeka destekli müşteri asistanısın. Türkçe konuşursun, samimi ve yardımseversin.

UZMANLIK ALANLARIN:
1. Bitki bakımı: ışık, su, toprak, gübre, hastalıklar, türler hakkında uzman tavsiyeler.
2. Site içeriği: ürün filtreleri, kategoriler, kupon kullanımı, sipariş süreci hakkında rehberlik.

[BİLGİ BANKASI REFERANSI] (Sadece gerektiğinde kullan, senin asıl bilgilerin):
{rag_context}

KURALLAR:
- DİKKAT: Bilgi bankasındaki (RAG) veriler İNGİLİZCE (veya başka dilde) olabilir. Ancak sen HER ZAMAN ve KESİNLİKLE sadece TÜRKÇE cevap vereceksin. Bilgiyi anla, çevir ve müşteriye Türkçe sun.
- KESİNLİKLE KAYNAK BELİRTME! Asla "Bilgi bankama göre", "Veritabanında yazana göre", "Bana verilen bilgilere göre" gibi ifadeler KULLANMA. Bilgiyi doğrudan sanki senin kendi zekanmış gibi, emin bir şekilde söyle.
- KENDİ YORUMUNU KATMA: Sadece sana verilen bilgi bankasındaki gerçeklere sadık kal. Ekstra hikaye, kişisel yorum veya bilgi bankasında olmayan detaylar uydurma.
- Yanıtların kısa, net, samimi. Çok uzun cevap verme (max 4-5 cümle).
- Bilmediğin bir şey için emin olmadığını söyle, uydurma.
- Sipariş veya kişisel veri talebinde, müşteri sipariş numarası verirse sadece o sipariş hakkında konuş.
- Bilgi bankasında (RAG) yer alan bilgileri öncelikli olarak kullan ancak bunu belli etme."""

    user_messages = []
    if context:
        ctx_text = ""
        if context.get("product"):
            p = context["product"]
            ctx_text += f"\n[KULLANICI ŞU AN İNCELİYOR] Ürün: {p.get('common_name_tr')} ({p.get('scientific_name')}), Kategori: {p.get('category')}, Bakım: {p.get('care_level')}, Işık: {p.get('light_need')}, Sulama: {p.get('water_need')}, Fiyat: ₺{p.get('price', 0):.2f}, Stok: {p.get('stock')}. Açıklama: {p.get('short_description', '')[:200]}"
        if context.get("order"):
            o = context["order"]
            items_str = ", ".join([f"{i['quantity']}x {i['name']}" for i in o.get('items', [])[:5]])
            ctx_text += f"\n[SİPARİŞ BİLGİSİ] #{o['id'][:8].upper()}, Durum: {o['status']}, Toplam: ₺{o['total']:.2f}, Ürünler: {items_str}, Tarih: {o.get('created_at', '')[:10]}"
        if context.get("page"):
            ctx_text += f"\n[KULLANICI SAYFASI] {context['page']}"
        if ctx_text:
            user_messages.append({"role": "system", "content": ctx_text})

    messages = [{"role": "system", "content": system_prompt}] + user_messages
    if history:
        for m in history[-6:]:  # last 6 turns
            if m.get("role") in ("user", "assistant") and m.get("content"):
                messages.append({"role": m["role"], "content": m["content"][:2000]})
    messages.append({"role": "user", "content": message[:2000]})

    headers = {"Authorization": f"Bearer {keys['mistral']}", "Content-Type": "application/json"}
    payload = {
        "model": "mistral-large-latest",
        "messages": messages,
        "temperature": 0.6,
        "max_tokens": 600,
    }
    r = requests.post("https://api.mistral.ai/v1/chat/completions", headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    body = r.json()
    reply_content = body["choices"][0]["message"]["content"].strip()
    return {"reply": reply_content, "suggestions": [], "sources": rag_results}

async def optimize_hero_content(variant_name: str, base_context: dict, db) -> Dict:
    keys = await _keys(db)
    if not keys["mistral"]:
        raise ValueError("Mistral API anahtarı tanımlı değil")

    schema_str = ""
    if variant_name == "Default":
        schema_str = """{
  "mainTitle": "string (vurucu başlık)",
  "subtitle": "string (açıklayıcı alt metin)",
  "primaryCtaLabel": "string (ana buton)",
  "secondaryCtaLabel": "string (ikincil buton)",
  "seoTitle": "string (50-60 char)",
  "seoDescription": "string (140-160 char)",
  "mainImagePrompt": "string (Görsel arama için DALL-E tarzı prompt)"
}"""
    elif variant_name == "BentoGrid":
        schema_str = """{
  "badge": "string (üst etiket, örn: Ev & Ofis İçin)",
  "mainTitle": "string (2-3 kelime büyük başlık)",
  "seoTitle": "string (50-60 char)",
  "seoDescription": "string (140-160 char)",
  "mainImagePrompt": "string (ana görsel prompt)",
  "bottomLeftImage1Prompt": "string (küçük görsel prompt)",
  "bottomLeftImage2Prompt": "string (küçük görsel prompt)",
  "rightTallImagePrompt": "string (dikey görsel prompt)"
}"""
    else:
        schema_str = """{"mainTitle": "string", "subtitle": "string"}"""

    prompt = f"""Sen Yeşil Dükkan (e-ticaret) için içerik optimize eden bir AI uzmanısın.
Kullanıcının girdiği temel içerik bilgilerine (context) dayanarak, anasayfa Hero Banner alanını '{variant_name}' isimli tasarım yapısına uygun şekilde optimize edeceksin.

KULLANICI GİRDİSİ (BASE CONTEXT):
{json.dumps(base_context, ensure_ascii=False, indent=2)}

İSTENEN JSON FORMATI:
{schema_str}

KURALLAR: 
1. SADECE JSON çıktısı üret. Markdown vb. kullanma.
2. Tüm metinler {base_context.get('language', 'tr')} dilinde olmalı.
3. İçerik e-ticaret dönüşüm (CTR) oranını artıracak şekilde profesyonel, sıcak ve SEO uyumlu olmalıdır.
4. 'Prompt' alanlarına resim stok sitelerinde (unsplash) aratılabilecek veya yapay zekaya çizdirilebilecek çok kısa (İngilizce) anahtar kelimeler yaz.
"""
    headers = {"Authorization": f"Bearer {keys['mistral']}", "Content-Type": "application/json"}
    payload = {
        "model": "mistral-large-latest",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 1000,
        "response_format": {"type": "json_object"},
    }
    r = requests.post(MISTRAL_URL, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    body = r.json()
    content = body["choices"][0]["message"]["content"]
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)
