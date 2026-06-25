"""Quick seed: log in as admin via API, run AI analyze on 3 sample images, then publish.
   Idempotent - skips if slug exists.
"""
import requests, json, os, sys
from pathlib import Path

BASE = "http://localhost:8001/api"
SAMPLES = Path("/app/poc/samples")

# Login
r = requests.post(f"{BASE}/auth/login", json={"email": "admin@yesildukkan.com", "password": "Admin1234!"})
r.raise_for_status()
token = r.json()["token"]
H = {"Authorization": f"Bearer {token}"}
print("Logged in as admin.")

# Existing products
existing = requests.get(f"{BASE}/admin/products", headers=H, params={"limit": 100}).json()
existing_slugs = {p["slug"] for p in existing["items"]}
print(f"Existing products: {len(existing_slugs)}")

PRICES = {"cactus1.jpg": 149.90, "aloe.jpg": 89.90, "monstera.jpg": 249.90}
FEATURED = {"cactus1.jpg", "monstera.jpg"}

for img_file in sorted(SAMPLES.glob("*.jpg")):
    print(f"\n--- {img_file.name} ---")
    # AI analyze
    with open(img_file, "rb") as f:
        files = {"file": (img_file.name, f, "image/jpeg")}
        ar = requests.post(f"{BASE}/admin/ai/analyze", headers=H, files=files, timeout=180)
    if ar.status_code != 200:
        print(f"  FAIL analyze: {ar.status_code} {ar.text[:200]}")
        continue
    body = ar.json()
    sug = body["suggestion"]
    image = body["image"]
    if sug["slug"] in existing_slugs:
        print(f"  Skip (slug exists): {sug['slug']}")
        continue

    payload = {
        "scientific_name": sug["scientific_name"],
        "common_name_tr": sug["common_name_tr"],
        "slug": sug["slug"],
        "category": sug["category"],
        "care_level": sug["care_level"],
        "light_need": sug["light_need"],
        "water_need": sug["water_need"],
        "size": sug["size"],
        "pet_safe": bool(sug["pet_safe"]),
        "short_description": sug["short_description"],
        "description": sug["description"],
        "care_tips": sug["care_tips"],
        "meta_title": sug["meta_title"],
        "meta_description": sug["meta_description"],
        "images": [{"main": image["main"], "thumb": image["thumb"], "alt": sug.get("alt_text", "")}],
        "price": PRICES.get(img_file.name, 99.90),
        "stock": 15,
        "is_published": True,
        "is_featured": img_file.name in FEATURED,
    }
    cr = requests.post(f"{BASE}/admin/products", headers=H, json=payload)
    if cr.status_code == 200:
        d = cr.json()
        print(f"  ✓ Created: {d['common_name_tr']} (slug={d['slug']})")
    else:
        print(f"  FAIL create: {cr.status_code} {cr.text[:200]}")

print("\nDone.")
