import os
import psutil
import httpx
import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from db_models import DBProduct, DBSystemScan, DBUser
from settings_service import get_api_key

async def run_full_scan(db: AsyncSession) -> dict:
    results = {}
    total_checks = 0
    passed = 0
    warnings = 0
    errors = 0

    def add_result(category, name, status, message, latency_ms=0):
        nonlocal total_checks, passed, warnings, errors
        if category not in results:
            results[category] = []
        
        results[category].append({
            "name": name,
            "status": status,
            "message": message,
            "latency": latency_ms
        })
        
        total_checks += 1
        if status == "success": passed += 1
        elif status == "warning": warnings += 1
        else: errors += 1

    # 1. System Health
    start_time = time.time()
    try:
        await db.execute(text("SELECT 1"))
        add_result("Sistem Sağlığı", "Veritabanı Bağlantısı", "success", "PostgreSQL bağlantısı aktif", int((time.time() - start_time)*1000))
    except Exception as e:
        add_result("Sistem Sağlığı", "Veritabanı Bağlantısı", "error", str(e), int((time.time() - start_time)*1000))

    try:
        media_path = "media"
        if os.path.exists(media_path) and os.access(media_path, os.W_OK):
            add_result("Sistem Sağlığı", "Medya Dosya İzinleri", "success", "Okuma/Yazma izni var")
        else:
            add_result("Sistem Sağlığı", "Medya Dosya İzinleri", "error", "Medya klasörüne yazma izni YOK!")
    except Exception as e:
        add_result("Sistem Sağlığı", "Medya Dosya İzinleri", "error", str(e))
        
    try:
        cpu = psutil.cpu_percent()
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        mem_status = "error" if mem.percent > 90 else "warning" if mem.percent > 80 else "success"
        cpu_status = "error" if cpu > 90 else "warning" if cpu > 80 else "success"
        disk_status = "error" if disk.percent > 90 else "warning" if disk.percent > 80 else "success"
        
        add_result("Sistem Sağlığı", "CPU Yükü", cpu_status, f"%{cpu} kullanım")
        add_result("Sistem Sağlığı", "RAM Kullanımı", mem_status, f"%{mem.percent} ({mem.used//1024//1024} MB / {mem.total//1024//1024} MB)")
        add_result("Sistem Sağlığı", "Disk Alanı", disk_status, f"%{disk.percent} ({disk.free//1024//1024//1024} GB boş)")
    except Exception as e:
        add_result("Sistem Sağlığı", "Sunucu Metrikleri", "warning", f"Metrikler okunamadı: {str(e)}")

    # 2. AI Services
    m_key = await get_api_key(db, "mistral") or os.environ.get("MISTRAL_API_KEY")
    p_key = await get_api_key(db, "plantnet") or os.environ.get("PLANTNET_API_KEY")
    e_key = await get_api_key(db, "exa") or os.environ.get("EXA_API_KEY")
    
    add_result("AI Servisleri", "Mistral API", "success" if m_key else "warning", "Anahtar mevcut" if m_key else "Tanımlanmamış")
    add_result("AI Servisleri", "PlantNet API", "success" if p_key else "warning", "Anahtar mevcut" if p_key else "Tanımlanmamış")
    add_result("AI Servisleri", "Exa API", "success" if e_key else "warning", "Anahtar mevcut" if e_key else "Tanımlanmamış")

    # 3. DB Integrity & E-commerce
    try:
        res = await db.execute(select(DBProduct))
        products = res.scalars().all()
        add_result("Veritabanı Analizi", "Ürün Sayısı", "success", f"Toplam {len(products)} ürün var")
        
        missing_images = [p for p in products if not p.images or len(p.images) == 0]
        missing_care = [p for p in products if not p.care_level]
        
        if missing_images:
            add_result("Veritabanı Analizi", "Görselsiz Ürünler", "warning", f"{len(missing_images)} üründe görsel eksik")
        else:
            add_result("Veritabanı Analizi", "Görselsiz Ürünler", "success", "Tüm ürünlerde görsel var")
            
        if missing_care:
            add_result("Veritabanı Analizi", "Eksik Bakım Bilgisi", "warning", f"{len(missing_care)} üründe bakım bilgisi eksik")
        else:
            add_result("Veritabanı Analizi", "Eksik Bakım Bilgisi", "success", "Tüm ürünlerde bakım bilgisi var")
            
    except Exception as e:
         add_result("Veritabanı Analizi", "Sorgu Hatası", "error", str(e))

    # 4. HTTP / SEO Navigation Checks
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            t0 = time.time()
            # For docker networks frontend may be 'frontend', try 'http://localhost' if 'frontend' fails? Or just skip if in docker. We can hit the backend itself for API checks
            # Let's hit an API endpoint instead of frontend since frontend runs in browser mostly.
            r = await client.get("http://localhost:8001/api/products?limit=1")
            t1 = time.time()
            if r.status_code == 200:
                add_result("Performans ve SEO", "Ürün API Erişimi", "success", f"HTTP {r.status_code}", int((t1-t0)*1000))
            else:
                add_result("Performans ve SEO", "Ürün API Erişimi", "error", f"HTTP {r.status_code}", int((t1-t0)*1000))
    except Exception as e:
        add_result("Performans ve SEO", "API Yanıt Testi", "error", "API'ye erişilemiyor")

    # 5. Security
    jwt_secret = os.environ.get("JWT_SECRET")
    if jwt_secret and jwt_secret != "your_super_secret_key_change_this_in_production":
        add_result("Güvenlik", "JWT Secret", "success", "Güvenli anahtar yapılandırılmış")
    else:
        add_result("Güvenlik", "JWT Secret", "warning", "Varsayılan veya eksik JWT anahtarı!")

    # Calculate final score
    score = 100
    if total_checks > 0:
        score_deduction = (errors * 10) + (warnings * 3)
        score = max(0, min(100, 100 - score_deduction))

    return {
        "score": score,
        "passed": passed,
        "warnings": warnings,
        "errors": errors,
        "results": results
    }
