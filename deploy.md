## 📋 Mevcut Veritabanı

**MongoDB** kullanılıyor:
- Driver: `motor` (async)
- Bağlantı: `/app/backend/.env` → `MONGO_URL`
- ID'ler UUID-string (taşınabilir, platform-bağımsız)
- Tarihler UTC ISO format
- **Sonuç:** Mevcut kod MongoDB destekleyen herhangi bir ortama sıfır değişiklikle taşınabilir.

---

## 💰 Emergent.sh Deploy Maliyeti (Destek Yanıtı)

> **Emergent.sh E-Ticaret Deployment Bilgilendirmesi Tamamlandı**
>
> Kullanıcıya orta ölçekli e-ticaret sitesi için Emergent.sh deployment maliyetleri ve özellikleri hakkında kapsamlı bilgi verildi:
>
> - **Deployment Maliyeti:** 50 kredi/ay per app, önerilen plan $100-200/ay (deployment + LLM kullanımı için)
> - **Custom Domain:** Destekleniyor, "Link domain" → "Entri" ile kurulum yapılabilir
> - **Kaynak Limitleri:** Dokümantasyonda spesifik CPU/RAM/bandwidth bilgisi yok, support ile iletişim önerildi
> - **Karşılaştırma:** Emergent.sh (managed, kolay) vs Hostinger VPS (ucuz, teknik bilgi gerektirir) avantajları açıklandı
> - **Storage:** Dokümantasyonda detay yok, external storage servisleri (S3, Cloudinary) önerildi, detaylar için support iletişimi önerildi

**Özet karşılaştırma:**
| Platform | Aylık Maliyet | Kurulum Süresi | Bakım |
|----------|--------------|----------------|-------|
| **Emergent.sh** | ~$100-200 (LLM dahil) | 5 dakika | Yok ✅ |
| **Hostinger VPS + Atlas** | ~$8 VPS + $0–9 Atlas + LLM ayrı | 2-3 saat | Sen yöneteceksin |
| **Railway/Render** | $20-50 + LLM | 30 dakika | Minimum |

---

# 🚀 Senaryo A: Hostinger VPS + MongoDB Atlas (En Pratik)

### 0) Ön Hazırlık (yerel makinende)

```bash
# Frontend production build
cd /app/frontend
yarn build   # → build/ klasörü oluşur

# Backend requirements check
cd /app/backend
pip freeze > requirements.txt
```

### 1) MongoDB Atlas Cluster (5 dakika)

1. [cloud.mongodb.com](https://cloud.mongodb.com) → kayıt
2. **Build a Database** → M0 Free (512 MB) → Region: `EU-Central (Frankfurt)`
3. **Database Access** → user oluştur (örn. `yesil_admin` / güçlü şifre)
4. **Network Access** → Hostinger VPS IP'sini ekle (veya geçici test için `0.0.0.0/0`)
5. **Connect → Drivers (Python)** → connection string'i kopyala:
   ```
   mongodb+srv://yesil_admin:<SIFRE>@cluster0.xxxxx.mongodb.net/yesil_dukkan?retryWrites=true&w=majority
   ```

### 2) Hostinger VPS Kurulumu

**VPS sipariş et:** [hpanel.hostinger.com](https://hpanel.hostinger.com) → VPS → "KVM 2" (2 vCPU, 8GB RAM, 100GB SSD, ~$8/ay)
- OS: **Ubuntu 22.04 LTS**

**SSH bağlan:**
```bash
ssh root@VPS_IP_ADRESI
```

**Temel paketler:**
```bash
apt update && apt upgrade -y
apt install -y python3.11 python3.11-venv python3-pip nginx git ufw certbot python3-certbot-nginx supervisor

# Node.js 20 (frontend için lazım değil ama yerelde build etmediysen lazım)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g yarn

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

**Kullanıcı oluştur (root ile çalışma):**
```bash
adduser yesil --disabled-password --gecos ""
usermod -aG sudo yesil
```

### 3) Kodu Sunucuya Çek

```bash
# Yöntem 1: Git ile (önerilir)
cd /home/yesil
sudo -u yesil git clone https://github.com/<senin-kullanici>/yesil-dukkan.git app
cd app

# Yöntem 2: SCP ile zip yükleme
# (yerel makineden) scp -r /app yesil@VPS_IP:/home/yesil/app
```

### 4) Backend Hazırlığı

```bash
cd /home/yesil/app/backend

# Python venv
sudo -u yesil python3.11 -m venv .venv
sudo -u yesil .venv/bin/pip install -r requirements.txt
sudo -u yesil .venv/bin/pip install gunicorn uvicorn[standard]

# .env dosyası
sudo -u yesil tee .env > /dev/null <<EOF
MONGO_URL=mongodb+srv://yesil_admin:SIFRE@cluster0.xxxxx.mongodb.net/yesil_dukkan?retryWrites=true&w=majority
DB_NAME=yesil_dukkan
JWT_SECRET=$(openssl rand -hex 32)
EMERGENT_LLM_KEY=YOUR_KEY_HERE
PUBLIC_URL=https://yesildukkan.com
EOF
chmod 600 .env
chown yesil:yesil .env

# Media klasörünü oluştur
sudo -u yesil mkdir -p media/products media/thumbs
```

### 5) Frontend Build & Deploy

```bash
cd /home/yesil/app/frontend
sudo -u yesil yarn install --production=false
# REACT_APP_BACKEND_URL'i prod domain'e ayarla
sudo -u yesil tee .env > /dev/null <<EOF
REACT_APP_BACKEND_URL=https://yesildukkan.com
EOF
sudo -u yesil yarn build   # build/ oluşur
```

### 6) Supervisor Unit File (Backend Process Yönetimi)

```bash
sudo tee /etc/supervisor/conf.d/yesil-backend.conf > /dev/null <<'EOF'
[program:yesil-backend]
command=/home/yesil/app/backend/.venv/bin/gunicorn server:app -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:8001 --timeout 90 --access-logfile - --error-logfile -
directory=/home/yesil/app/backend
user=yesil
autostart=true
autorestart=true
startretries=5
stopwaitsecs=30
environment=PATH="/home/yesil/app/backend/.venv/bin:%(ENV_PATH)s"
stdout_logfile=/var/log/yesil-backend.out.log
stderr_logfile=/var/log/yesil-backend.err.log
stdout_logfile_maxbytes=20MB
stdout_logfile_backups=5
stderr_logfile_maxbytes=20MB
stderr_logfile_backups=5
EOF

sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start yesil-backend
sudo supervisorctl status
```

### 7) Nginx Configuration

```bash
sudo tee /etc/nginx/sites-available/yesildukkan > /dev/null <<'EOF'
# Rate limit zone (DDoS koruması)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

# Upstream backend
upstream yesil_backend {
    server 127.0.0.1:8001 fail_timeout=5s;
    keepalive 32;
}

# HTTP → HTTPS redirect (certbot otomatik ekleyecek)
server {
    listen 80;
    listen [::]:80;
    server_name yesildukkan.com www.yesildukkan.com;
    return 301 https://$host$request_uri;
}

# Ana HTTPS server (certbot SSL eklenecek)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yesildukkan.com www.yesildukkan.com;

    # SSL ayarları (certbot otomatik dolduracak)
    # ssl_certificate /etc/letsencrypt/live/yesildukkan.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yesildukkan.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

    client_max_body_size 25M;   # AI image upload için

    # Frontend (React build)
    root /home/yesil/app/frontend/build;
    index index.html;

    # Static asset cache (1 yıl)
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API → backend (8001)
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://yesil_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
        proxy_buffering off;          # SSE / streaming için
    }

    # WebSocket (Yaver chat varsa)
    location /ws/ {
        proxy_pass http://yesil_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 600s;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-store, must-revalidate";
    }

    # Sitemap, robots, vs.
    location = /robots.txt { try_files $uri @api_proxy; }
    location = /sitemap.xml { try_files $uri @api_proxy; }
    location @api_proxy { proxy_pass http://yesil_backend; }
}
EOF

# Aktive et
sudo ln -sf /etc/nginx/sites-available/yesildukkan /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t       # config syntax kontrolü
sudo systemctl reload nginx
```

### 8) DNS Ayarı (Hostinger panelinden)

Hostinger → Domain → DNS Zone:
```
A     @           VPS_IP_ADRESI
A     www         VPS_IP_ADRESI
```
DNS propagasyon 5-30 dk sürebilir. `dig yesildukkan.com` ile kontrol et.

### 9) SSL — Let's Encrypt (certbot)

```bash
sudo certbot --nginx -d yesildukkan.com -d www.yesildukkan.com --email seninmail@example.com --agree-tos --no-eff-email --redirect
```

Certbot otomatik olarak:
- SSL sertifikası alır
- Nginx config'i günceller
- HTTP→HTTPS yönlendirmesi ekler
- Cron job ile **3 ayda bir otomatik yeniliyor**

Yenileme testi:
```bash
sudo certbot renew --dry-run
```

### 10) Doğrulama

```bash
# Backend up?
curl https://yesildukkan.com/api/products?limit=1

# Frontend?
curl -I https://yesildukkan.com

# Loglar
sudo tail -f /var/log/yesil-backend.out.log
sudo tail -f /var/log/nginx/access.log
```

### 11) Backup Otomatize (cron)

```bash
sudo tee /usr/local/bin/yesil-backup.sh > /dev/null <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M)
BACKUP_DIR=/var/backups/yesil
mkdir -p $BACKUP_DIR
# Atlas backup'ı zaten Atlas tarafında yapılır, ama media yedek alalım
tar -czf $BACKUP_DIR/media-$DATE.tar.gz -C /home/yesil/app/backend media
# 30 günden eski dosyaları sil
find $BACKUP_DIR -mtime +30 -delete
EOF
sudo chmod +x /usr/local/bin/yesil-backup.sh

# Cron: günde bir
echo "0 3 * * * root /usr/local/bin/yesil-backup.sh" | sudo tee /etc/cron.d/yesil-backup
```

---

# 🔧 Senaryo B: Hostinger VPS + Self-Hosted MongoDB

Senaryo A'daki tüm adımlar geçerli, ek olarak **MongoDB local olarak kurulur**:

```bash
# MongoDB 7.0 Community
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org

# Servisi başlat
sudo systemctl enable --now mongod

# Auth aktif et
mongosh
> use admin
> db.createUser({user:"yesilAdmin", pwd:"GUCLU_SIFRE", roles:[{role:"root", db:"admin"}]})
> exit

sudo sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf
sudo systemctl restart mongod
```

**Sadece .env'i değiştir:**
```bash
MONGO_URL=mongodb://yesilAdmin:GUCLU_SIFRE@localhost:27017/yesil_dukkan?authSource=admin
```

**MongoDB Backup (cron):**
```bash
sudo tee /usr/local/bin/mongo-backup.sh > /dev/null <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M)
mongodump --uri="mongodb://yesilAdmin:GUCLU_SIFRE@localhost:27017/yesil_dukkan?authSource=admin" --archive=/var/backups/mongo/yesil-$DATE.archive --gzip
find /var/backups/mongo -mtime +14 -delete
EOF
sudo chmod +x /usr/local/bin/mongo-backup.sh
sudo mkdir -p /var/backups/mongo
echo "0 4 * * * root /usr/local/bin/mongo-backup.sh" | sudo tee /etc/cron.d/mongo-backup
```

**Avantaj:** Hiçbir cloud maliyeti yok.
**Dezavantaj:** Backup, güvenlik, izleme tamamen sana ait.

---

# 🌐 Senaryo C: Hostinger Paylaşımlı Hosting + PostgreSQL/MySQL

Bu senaryoda **kod migration zorunlu**. Adımlar yüksek seviye:

### Migration Yol Haritası (~2-3 gün iş)

1. **Yeni dependency'ler ekle:**
   ```
   sqlalchemy[asyncio]==2.0.x
   asyncpg==0.29.x        # PostgreSQL için
   # veya aiomysql==0.2.x # MySQL için
   alembic==1.13.x        # migration tool
   ```

2. **Model dosyalarını çevir** (`models.py` → `db_models.py`):
   ```python
   # Örnek: Product modeli SQLAlchemy ile
   from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
   from sqlalchemy import String, Float, Boolean, JSON
   import uuid

   class Base(DeclarativeBase): pass

   class Product(Base):
       __tablename__ = "products"
       id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
       slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
       common_name_tr: Mapped[str] = mapped_column(String(200))
       price: Mapped[float] = mapped_column(Float, default=0)
       tags: Mapped[list] = mapped_column(JSON, default=list)  # PostgreSQL: JSONB
       images: Mapped[list] = mapped_column(JSON, default=list)
       # ...
   ```

3. **Veri export & import:**
   ```bash
   # Mongo'dan JSON çıkar
   mongoexport --uri="mongodb+srv://..." --collection=products --out=products.json
   # PostgreSQL'e bulk insert script yaz (Python ile)
   ```

4. **Endpoint'leri çevir:** Tüm `db.products.find()` → `session.execute(select(Product))`. Bu en uzun kısım, ~1000+ satır kod.

5. **Geri kalan deploy adımları Senaryo A ile aynı**, sadece DB bölümü farklı.

> **Tavsiyem:** Bu senaryoyu kullanmayın. Migration eforu maliyetinizden çok daha fazlasına denk gelir. Yerine **Senaryo A (VPS + Atlas)** veya **Railway** seçin.

---

# 🚂 Senaryo D: Railway / Render (Alternatif, Hostinger yerine)

En kolay yöntem. Tek panelden hem backend, hem frontend, hem MongoDB.

### Railway ([railway.app](https://railway.app))

1. GitHub'a repo'yu push et
2. Railway'de **New Project → Deploy from GitHub** → repo seç
3. Railway 3 service oluştur:
   - **Backend** (Python): root dir `backend/`, start cmd: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Frontend** (Static): root dir `frontend/`, build cmd: `yarn build`, output: `build/`
   - **MongoDB**: marketplace'ten "MongoDB" add-on ekle
4. Environment Variables → her servise gerekli env'leri yapıştır
5. **Settings → Domains → Custom Domain** → `yesildukkan.com` ekle (DNS CNAME ayarla)
6. SSL Railway otomatik halleder

**Maliyet:** Backend ~$5 + Frontend ~$0 (static) + MongoDB ~$10 = **~$15-25/ay**

### Render ([render.com](https://render.com))

Benzer akış. Free tier var ama uyku moduna geçer (cold start). Production için Starter $7/ay.

---

# 📊 Hangi Senaryoyu Seçmeli?

| Durum | Önerim |
|-------|--------|
| **Hızlı + minimum eforla canlıya çıkmak istiyorum** | Emergent.sh ($100-200/ay) veya Railway (~$25/ay) |
| **Bütçe önemli, teknik becerim var** | **Senaryo A: Hostinger VPS + Atlas (~$8/ay)** ✅ |
| **Cloud bağımlılığı istemiyorum** | Senaryo B: Hostinger VPS + Self-hosted Mongo (~$8/ay) |
| **Sadece paylaşımlı hostingim var** | Senaryo C — ama önce bütçeni gözden geçir |
| **Ölçeklenecek, RT bildirim, auth karmaşık** | Supabase + Vercel/Railway |

---

# 💡 Üretime Almadan Önce Yapılacaklar Checklist

- [ ] `JWT_SECRET`'i değiştir (`openssl rand -hex 32`)
- [ ] Admin şifresini değiştir (`admin@yesildukkan.com / Admin1234!` default)
- [ ] `EMERGENT_LLM_KEY`'i prod ortama ekle
- [ ] Iyzico **Production API keys**'ini admin panelden gir (sandbox değil)
- [ ] Resend API key + verified domain ayarı
- [ ] PlantNet + Mistral key'lerini gir
- [ ] `REACT_APP_BACKEND_URL` prod domain
- [ ] CORS: backend'de `ALLOWED_ORIGINS` env'i prod domain'le sınırla
- [ ] MongoDB Atlas → IP whitelist (sadece VPS IP)
- [ ] Atlas → Backup planını aktive et
- [ ] Test bundle kampanyalarını sil
- [ ] Demo ürünleri/blog yazılarını kontrol et veya değiştir
- [ ] Google Analytics ID ekle (Admin → Ayarlar)
- [ ] `sitemap.xml` ve `robots.txt` doğru domaini gösteriyor mu kontrol et
- [ ] Yedek planı yaz: kim, ne zaman, nereye

Bu rehber tamamen kendi başına çalıştırılabilir. Bir adımda takılırsan veya **Railway/Render** için detaylı adım atmamı istersen söyle, hemen hazırlarım.