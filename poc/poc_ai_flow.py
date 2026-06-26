"""
POC: PlantNet + Mistral Pixtral Large + Image Optimization
Tests the core AI flow for Yeşil Dükkan:
1) PlantNet identifies scientific name from plant image
2) Mistral Pixtral Large generates Turkish taxonomy/SEO JSON
3) Pillow optimizes image (webp + thumbnail)
"""
import os
import sys
import io
import json
import base64
import time
import re
from pathlib import Path
import requests
from PIL import Image

# ---------- CONFIG ----------
PLANTNET_API_KEY = "2b10o1iz5msPhZ8HsgLTgWuqte"
MISTRAL_API_KEY = "zmpWEhUVRNgqHmTyGEACuAWM9iJP3MFF"

PLANTNET_URL = f"https://my-api.plantnet.org/v2/identify/all?api-key={PLANTNET_API_KEY}"
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_MODEL = "pixtral-large-latest"
DEBUG = os.environ.get("DEBUG", "0") == "1"

SAMPLES_DIR = Path(__file__).parent / "samples"
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Enums per spec
CATEGORIES = ["Kaktüsler", "Sukulentler", "İç Mekan Bitkileri", "Dış Mekan Bitkileri",
              "Meyve Fidanları", "Çiçekler", "Tırmanıcı Bitkiler", "Palmiyeler", "Bonsailer"]
CARE_LEVELS = ["Kolay Bakım", "Orta Bakım", "Uzman Bakım"]
LIGHT_NEEDS = ["Tam Güneş", "Yarı Gölge", "Gölge"]
WATER_NEEDS = ["Az", "Orta", "Yüksek"]
SIZES = ["Mini (0-20 cm)", "Küçük (20-50 cm)", "Orta (50-100 cm)", "Büyük (100+ cm)"]


def log(msg, lvl="INFO"):
    print(f"[{lvl}] {msg}", flush=True)


# ---------- IMAGE PIPELINE ----------
def optimize_image(image_path: Path, out_dir: Path, base_name: str) -> dict:
    """Resize → webp + thumb."""
    img = Image.open(image_path).convert("RGB")
    w, h = img.size

    # Resize: max 1600 width keeping aspect
    MAX_W = 1600
    if w > MAX_W:
        ratio = MAX_W / w
        img = img.resize((MAX_W, int(h * ratio)), Image.Resampling.LANCZOS)

    main_path = out_dir / f"{base_name}.webp"
    img.save(main_path, "WEBP", quality=85, method=6)

    # Thumb (400px wide)
    tw, th = img.size
    THUMB_W = 400
    thumb_ratio = THUMB_W / tw
    thumb = img.resize((THUMB_W, int(th * thumb_ratio)), Image.Resampling.LANCZOS)
    thumb_path = out_dir / f"{base_name}_thumb.webp"
    thumb.save(thumb_path, "WEBP", quality=80, method=6)

    return {
        "main": str(main_path),
        "thumb": str(thumb_path),
        "main_size_kb": round(main_path.stat().st_size / 1024, 2),
        "thumb_size_kb": round(thumb_path.stat().st_size / 1024, 2),
        "dimensions_main": img.size,
        "dimensions_thumb": thumb.size,
    }


# ---------- PLANTNET ----------
def identify_with_plantnet(image_path: Path) -> dict:
    """Calls PlantNet to identify plant species."""
    with open(image_path, "rb") as f:
        files = [("images", (image_path.name, f, "image/jpeg"))]
        data = {"organs": "auto"}
        # Note: 'auto' is the default organ when not sure
        r = requests.post(PLANTNET_URL, files=files, data=data, timeout=60)
    if r.status_code != 200:
        # Try with "leaf" organ if "auto" fails
        log(f"PlantNet returned {r.status_code}: {r.text[:200]}", "WARN")
        r.raise_for_status()
    data = r.json()
    results = data.get("results", [])
    if not results:
        return {"scientific_name": None, "common_names": [], "score": 0, "raw": data}
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


# ---------- MISTRAL PIXTRAL ----------
def image_to_data_url(image_path: Path) -> str:
    """Convert a local image to a data URL for Mistral Pixtral."""
    with open(image_path, "rb") as f:
        b = f.read()
    b64 = base64.b64encode(b).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def build_taxonomy_prompt(plantnet: dict) -> str:
    common = ", ".join(plantnet.get("common_names", [])[:3]) or "bilinmiyor"
    return f"""Sen Yeşil Dükkan adlı Türkçe bir bitki e-ticaret platformu için ürün taksonomi üreten bir asistansın.

Bu bitki için (PlantNet sonucu: scientific_name="{plantnet.get('scientific_name')}", family="{plantnet.get('family')}", common_names="{common}"), aşağıdaki JSON formatında SADECE GEÇERLİ JSON döndür. Açıklama veya ek metin ekleme.

Şema (her alan zorunludur):
{{
  "scientific_name": "string (Latince bilimsel ad)",
  "common_name_tr": "string (Türkçe yaygın ad)",
  "slug": "string (SEO dostu, küçük harf, tire ile ayrılmış, Türkçe karakter yok)",
  "category": "string (şu listeden BİRİNİ seç: {', '.join(CATEGORIES)})",
  "care_level": "string ({' / '.join(CARE_LEVELS)})",
  "light_need": "string ({' / '.join(LIGHT_NEEDS)})",
  "water_need": "string ({' / '.join(WATER_NEEDS)})",
  "size": "string ({' / '.join(SIZES)})",
  "pet_safe": "boolean (true/false - evcil hayvanlar için güvenli mi)",
  "tags": ["string", "..."] (3-6 adet SEO etiketi, küçük harf, tire-li, örn: "kolay-bakim-bitkileri", "mini-bitkiler", "az-sulanan-bitkiler", "tam-gunes-seven-bitkiler"),
  "short_description": "string (1 cümle, max 160 karakter, Türkçe)",
  "description": "string (200-400 kelime, Türkçe, akıcı, SEO uyumlu paragraflar)",
  "care_tips": ["string", "string", "string", "string", "string"] (5 madde Türkçe bakım ipucu),
  "alt_text": "string (görsel için SEO uyumlu Türkçe ALT metin, max 125 karakter)",
  "meta_title": "string (SEO başlığı, 50-60 karakter, Türkçe)",
  "meta_description": "string (SEO açıklaması, 140-160 karakter, Türkçe)"
}}

KURALLAR:
- Çıktı SADECE JSON olsun (markdown code fence kullanma, sadece düz JSON).
- Enum değerlerini KESİNLİKLE listeden seç (Türkçe karakterlerle aynen).
- slug ve tags: ASCII (Türkçe karakter dönüştür: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u), boşluk yerine tire (-), küçük harf.
- pet_safe boolean: kaktüs/sukulent çoğunlukla evcil hayvanlar için güvenli (dikenler hariç), Monstera/Dieffenbachia toksik. Bilimsel ada göre karar ver.
"""


def call_mistral_pixtral(image_path: Path, plantnet: dict) -> dict:
    """Call Mistral Pixtral Large with image + structured JSON output."""
    data_url = image_to_data_url(image_path)
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MISTRAL_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": build_taxonomy_prompt(plantnet)},
                    {"type": "image_url", "image_url": data_url},
                ],
            }
        ],
        "temperature": 0.2,
        "max_tokens": 2000,
        "response_format": {"type": "json_object"},
    }
    r = requests.post(MISTRAL_URL, headers=headers, json=payload, timeout=120)
    if r.status_code != 200:
        log(f"Mistral error {r.status_code}: {r.text[:400]}", "ERROR")
        r.raise_for_status()
    body = r.json()
    content = body["choices"][0]["message"]["content"]
    # Try to parse JSON (may be wrapped in code fences)
    content_clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.MULTILINE)
    try:
        parsed = json.loads(content_clean)
    except json.JSONDecodeError as e:
        log(f"JSON parse failed: {e}\nRaw: {content[:500]}", "ERROR")
        raise
    return parsed


# ---------- VALIDATION ----------
REQUIRED_FIELDS = [
    "scientific_name", "common_name_tr", "slug", "category", "care_level",
    "light_need", "water_need", "size", "pet_safe", "tags",
    "short_description", "description", "care_tips", "alt_text",
    "meta_title", "meta_description"
]


def validate_ai_output(ai: dict) -> list:
    errs = []
    for f in REQUIRED_FIELDS:
        if f not in ai:
            errs.append(f"Missing field: {f}")
    if "category" in ai and ai["category"] not in CATEGORIES:
        errs.append(f"Invalid category: {ai['category']}")
    if "care_level" in ai and ai["care_level"] not in CARE_LEVELS:
        errs.append(f"Invalid care_level: {ai['care_level']}")
    if "light_need" in ai and ai["light_need"] not in LIGHT_NEEDS:
        errs.append(f"Invalid light_need: {ai['light_need']}")
    if "water_need" in ai and ai["water_need"] not in WATER_NEEDS:
        errs.append(f"Invalid water_need: {ai['water_need']}")
    if "size" in ai and ai["size"] not in SIZES:
        errs.append(f"Invalid size: {ai['size']}")
    if "pet_safe" in ai and not isinstance(ai["pet_safe"], bool):
        errs.append(f"pet_safe must be bool, got {type(ai['pet_safe']).__name__}")
    if "slug" in ai:
        if not re.match(r"^[a-z0-9-]+$", ai["slug"] or ""):
            errs.append(f"Invalid slug format: {ai['slug']}")
    if "tags" in ai:
        if not isinstance(ai["tags"], list) or len(ai["tags"]) < 2:
            errs.append("tags must be list with at least 2 items")
        else:
            for t in ai["tags"]:
                if not re.match(r"^[a-z0-9-]+$", t or ""):
                    errs.append(f"Invalid tag format: {t}")
    if "care_tips" in ai and (not isinstance(ai["care_tips"], list) or len(ai["care_tips"]) < 3):
        errs.append("care_tips must be a list with at least 3 items")
    return errs


# ---------- TEST RUNNER ----------
def run_test(image_path: Path):
    log(f"========== Testing: {image_path.name} ==========")
    base_name = image_path.stem

    # Step 1: Image optimization
    log("Step 1: Image optimization (webp + thumb)...")
    img_out = optimize_image(image_path, OUTPUT_DIR, base_name)
    log(f"  ✓ Main: {img_out['main_size_kb']} KB ({img_out['dimensions_main']})")
    log(f"  ✓ Thumb: {img_out['thumb_size_kb']} KB ({img_out['dimensions_thumb']})")

    # Step 2: PlantNet identify
    log("Step 2: PlantNet identifying species...")
    t0 = time.time()
    plant = identify_with_plantnet(image_path)
    log(f"  ✓ Scientific: {plant['scientific_name']} | Score: {plant['score']} ({time.time()-t0:.1f}s)")
    log(f"  ✓ Common: {plant.get('common_names', [])[:3]}")

    if not plant["scientific_name"]:
        log("  ✗ PlantNet failed to identify", "ERROR")
        return False, {}

    # Step 3: Mistral Pixtral - taxonomy + content
    log("Step 3: Mistral Pixtral generating Turkish taxonomy + content...")
    t0 = time.time()
    ai = call_mistral_pixtral(image_path, plant)
    log(f"  ✓ Generated ({time.time()-t0:.1f}s)")

    # Step 4: Validation
    log("Step 4: Validating AI output...")
    errs = validate_ai_output(ai)
    if errs:
        for e in errs:
            log(f"  ✗ {e}", "ERROR")
        if DEBUG:
            # Save anyway for debug
            with open(OUTPUT_DIR / f"{base_name}_failed.json", "w", encoding="utf-8") as f:
                json.dump(ai, f, ensure_ascii=False, indent=2)
        return False, ai
    log("  ✓ All fields valid")

    # Save result
    result = {
        "image": img_out,
        "plantnet": plant,
        "ai": ai,
    }
    with open(OUTPUT_DIR / f"{base_name}_result.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    log(f"  → Category: {ai['category']} | Care: {ai['care_level']} | Light: {ai['light_need']} | Water: {ai['water_need']} | Size: {ai['size']}")
    log(f"  → Slug: {ai['slug']}")
    log(f"  → Tags: {ai['tags']}")
    log(f"  → Pet-safe: {ai['pet_safe']}")
    log(f"  → ALT text: {ai['alt_text']}")
    log(f"  → Title: {ai['common_name_tr']}")
    return True, result


def main():
    samples = sorted(SAMPLES_DIR.glob("*.jpg"))
    if not samples:
        log("No samples found", "ERROR")
        sys.exit(1)
    log(f"Found {len(samples)} sample images: {[s.name for s in samples]}")

    results = []
    for s in samples:
        try:
            ok, res = run_test(s)
            results.append({"image": s.name, "success": ok})
        except Exception as e:
            log(f"  ✗ EXCEPTION: {e}", "ERROR")
            import traceback; traceback.print_exc()
            results.append({"image": s.name, "success": False, "error": str(e)})

    log("\n========== SUMMARY ==========")
    passed = sum(1 for r in results if r["success"])
    total = len(results)
    for r in results:
        status = "PASS" if r["success"] else "FAIL"
        log(f"  [{status}] {r['image']}")
    log(f"Total: {passed}/{total} passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
