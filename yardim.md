# Kapsamlı Sorun Giderme ve Yardım Rehberi (yardim.md)

Canlı ortamda (Production) işler her zaman planlandığı gibi gitmeyebilir. Bu doküman, Hostinger KVM 2 VPS üzerinde projenizi yönetirken karşılaşabileceğiniz **en yaygın hataları, acil durumları ve çözüm yöntemlerini** içerir. 

> [!TIP]
> Bir şeyler ters gittiğinde paniğe kapılmayın. Hataların %90'ı sadece loglara (kayıtlara) bakılarak çözülebilir.

---

## 1. Sitem Çöktü (Açılmıyor) veya 502 Bad Gateway Hatası Veriyor

**Belirti:** Siteye girdiğinizde hiçbir şey yüklenmiyor veya ekranda beyaz bir sayfada "502 Bad Gateway" yazıyor.
**Sebep:** Arka yüz (Backend) servisi çökmüş, Nginx'e yanıt veremiyor veya Docker kapalı.

**Nasıl Çözülür?**
1. Sunucuya SSH ile bağlanın.
2. Tüm sistemlerin ayakta olup olmadığını kontrol edin:
   ```bash
   docker compose ps
   ```
   *Eğer `cactus_care_backend` karşısında `Exit (1)` veya `Restarting` yazıyorsa backend çökmüştür.*
3. Çökme sebebini (hatanın ne olduğunu) okumak için loglara bakın:
   ```bash
   docker logs --tail 50 cactus_care_backend
   ```
4. Loglarda "Veritabanına bağlanılamadı" veya benzeri bir hata görüyorsanız, veritabanının açık olduğundan emin olun. Sistemi tamamen kapatıp tekrar başlatmayı deneyin:
   ```bash
   docker compose down
   docker compose up -d
   ```

## 2. Sunucuda Yer Kalmadı (No space left on device)

**Belirti:** Sitede resim yüklerken hata alıyorsunuz, veritabanı durduk yere kapanıyor veya `docker compose up` komutu "No space left on device" diyerek başarısız oluyor.
**Sebep:** Sunucunuzun hard diski (KVM 2 için muhtemelen 50-60GB) dolmuştur. Docker, zamanla kullanılmayan eski imajlarla (images) diski doldurabilir.

**Nasıl Çözülür?**
1. Diskte ne kadar yer kaldığını kontrol edin:
   ```bash
   df -h
   ```
   *`/` dizininin `%100` dolu olup olmadığına bakın.*
2. Docker'ın gereksiz ve kullanılmayan tüm çöp dosyalarını tek komutla temizleyin:
   ```bash
   docker system prune -a --volumes
   ```
   *(Çıkan uyarıya `y` diyerek onaylayın. Bu komut sadece aktif projeyi korur, eski çöpleri siler).*

## 3. Veritabanı Hataları (Database Connection Refused / Authentication Failed)

**Belirti:** Arka yüz loglarında `FATAL: password authentication failed for user` veya `Connection refused` yazıyor.
**Sebep:** `docker-compose.yml` içindeki `POSTGRES_PASSWORD` ile `DATABASE_URL` içindeki şifre eşleşmiyordur veya Postgres konteyneri başlatılamamıştır.

**Nasıl Çözülür?**
1. `docker-compose.yml` dosyanızı açın ve şifreleri kontrol edin:
   ```bash
   nano docker-compose.yml
   ```
2. Eğer şifreyi daha önce değiştirdiyseniz ancak Postgres eski şifreyi hatırlıyorsa (çünkü veriler silinmez), Postgres verisini tamamen sıfırlamak isteyebilirsiniz **(DİKKAT: TÜM VERİLERİNİZ SİLİNİR)**:
   ```bash
   docker compose down
   docker volume rm cactus-care-market-main_postgres_data
   docker compose up -d
   ```

## 4. Port Zaten Kullanımda (Bind for 0.0.0.0:80 failed: port is already allocated)

**Belirti:** Projeyi başlatmak istediğinizde port 80 veya 5432 dolu hatası alıyorsunuz.
**Sebep:** Sunucunuzda (Ubuntu) projenin kullanmak istediği portu kullanan başka bir program var (Örn: Apache2).

**Nasıl Çözülür?**
1. Portu hangi programın meşgul ettiğini bulun:
   ```bash
   lsof -i :80
   # veya
   netstat -tulpn | grep :80
   ```
2. Genellikle Ubuntu ile birlikte gelen `apache2` sebep olur. Onu kalıcı olarak silip kapatın:
   ```bash
   systemctl stop apache2
   systemctl disable apache2
   apt remove apache2 -y
   ```
3. Projeyi tekrar ayağa kaldırın:
   ```bash
   docker compose up -d
   ```

## 5. Uygulama Çok Fazla RAM Tüketiyor ve Sunucu Kitleniyor (Out of Memory - OOM)

**Belirti:** SSH ile sunucuya bağlanırken çok yavaşlık çekiyorsunuz veya bağlantı sürekli kopuyor. Konteynerler durduk yere kapanıyor.
**Sebep:** KVM 2 paketinde sınırlı RAM bulunur. Özellikle RAG veya Yapay Zeka işlemleri sırasında RAM sınırı aşılabilir.

**Nasıl Çözülür?**
1. Sunucunuzun anlık RAM kullanımını canlı izleyin:
   ```bash
   htop
   # Çıkmak için F10 veya CTRL+C
   ```
2. Sorun tekrarlanıyorsa Sunucunuza (Ubuntu) **Swap Alanı (Sanal RAM)** ekleyebilirsiniz:
   ```bash
   fallocate -l 4G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
   ```
   *Bu işlem sunucunuzun çökmesini engelleyecek büyük bir sanal hafıza oluşturur.*

## 6. Sitede Yaptığım Güncellemeler (Kod Değişiklikleri) Canlıda Görünmüyor

**Belirti:** Kodunuzu bilgisayarınızda değiştirip sunucuya attınız ancak site aynı kaldı.
**Sebep:** Docker eski kopyayı (cache) kullanıyordur veya Nginx/Tarayıcı önbelleğe almıştır.

**Nasıl Çözülür?**
1. Sistemin en güncel halini zorla yeniden inşa edin (Cache'i hiçe sayarak):
   ```bash
   docker compose up -d --build --force-recreate
   ```
2. Sorun hala devam ediyorsa tarayıcınızda `CTRL + F5` yaparak hard-reload (önbellek temizlemeli yenileme) yapın.

## 7. Acil Durum "Kırmızı Buton" (Sistemi Tamamen Sıfırlama)

> [!CAUTION]
> Bu işlem veritabanı hariç (veritabanı volume olarak tutulur) her şeyi tamamen sıfırlar. Sadece işin içinden çıkamadığınız kod çakışması durumlarında kullanın.

```bash
# Tüm çalışan sistemi zorla kapatır
docker compose down

# Tüm docker imajlarını (cache dahil) siler
docker system prune -a --volumes -f

# Proje kodlarınızı Github'dan en temiz haliyle zorla günceller
git fetch --all
git reset --hard origin/main

# Her şeyi sıfırdan indirip tekrar inşa eder
docker compose up -d --build
```

---

## 🛠 Hayat Kurtaran Docker Komutları Özet Listesi

| Ne Yapmak İstiyorsunuz? | Terminal Komutu |
| :--- | :--- |
| Tüm sistemi arka planda başlat | `docker compose up -d` |
| Sadece Backend'i yeniden başlat | `docker compose restart backend` |
| Sadece Frontend'i yeniden inşa et | `docker compose up -d --build frontend` |
| Hangi servisler çalışıyor gör | `docker compose ps` |
| Backend anlık hataları canlı izle | `docker logs -f cactus_care_backend` |
| Frontend anlık hataları canlı izle | `docker logs -f cactus_care_frontend` |
| Veritabanının (Postgres) içine gir | `docker exec -it cactus_care_postgres psql -U yesil_admin -d yesil_dukkan` |
| Backend konsoluna (Terminaline) gir | `docker exec -it cactus_care_backend /bin/bash` |
