Bu özellik gerçekten çok değerli bir fikir. Özellikle AI destekli e-ticaret + blog + bitki veritabanı gibi çok modüllü bir sistemde tek tıkla sağlık kontrolü (System Doctor / Health Center), hem geliştirme sürecinde hem de canlı ortamda sorunları kullanıcı fark etmeden tespit etmeyi sağlar.

Sadece CRUD ve API key kontrolü değil; veritabanı, AI servisleri, SEO araçları, medya sistemi, kuyruk işleri, cache, dosya sistemi, URL yönlendirmeleri, sitemap ve hatta performans testleri de kontrol edilmeli.

Eklenmesi gereken modüller

1. Sistem Sağlık Kontrolleri (Health Checks)

Temel

Bunlar anlık durum göstergeleri olmalı.

| Kontrol                  | Açıklama                                 |
| ------------------------ | ---------------------------------------- |
| Veritabanı bağlantısı    | Bağlantı kurulabiliyor mu?               |
| Migration durumu         | Eksik migration var mı?                  |
| CRUD işlemleri           | Create / Read / Update / Delete testleri |
| Dosya sistemi yazma izni | uploads, cache, logs klasörleri          |
| Cache sistemi            | Redis / file cache çalışıyor mu?         |
| Queue sistemi            | Arka plan işleri işleniyor mu?           |
| Cron görevleri           | Zamanlanmış görevler çalışıyor mu?       |
| Storage alanı            | Disk doluluk oranı                       |
| Memory kullanımı         | RAM kullanımı                            |
| CPU yükü                 | Sunucu yük durumu                        |

2. AI Servis Kontrolleri

Senin proje için kritik bölüm burası.

Kontrol edilecek servisler:

* PlantNet API Key (Bitki Tanıma)
* Mistral AI API Key (RAG & Metin Üretimi)
* Exa API Key (Semantik Arama & SEO)
* Resend API Key (E-posta Gönderimi)
* İyzico API Key (Ödeme) ve İyzico Secret Key
* Embedding servisi
* Google Analytics ID
* Reranking servisi
* AI SEO Copilot motoru
* İçerik üretim servisi
* Görsel üretim servisi
* PDF analiz servisi

Her servis için:

* API anahtarı mevcut mu?
* Yetki geçerli mi?
* Bağlantı süresi (ms)
* Son başarılı istek zamanı
* Hata mesajı (varsa)

Örnek durum kartı:

OpenRouter API:Çalışıyor
Durum:Başarılı
Gecikme:412 ms
Son kontrol:26.06.2026 14:21
Model erişimi:Var

3. SEO & GEO Kontrolleri

Bu bölüm seni rakiplerden ayırır.

| Kontrol                       | Açıklama     |
| ----------------------------- | ------------ |
| robots.txt erişilebilir mi?   | 200 dönmeli  |
| sitemap.xml erişilebilir mi?  | 200 dönmeli  |
| Blog sitemap'i                | Ayrı kontrol |
| Ürün sitemap'i                | Ayrı kontrol |
| Canonical URL hataları        | Tespit et    |
| Eksik meta title              | Listele      |
| Eksik meta description        | Listele      |
| Eksik Open Graph etiketleri   | Listele      |
| Eksik JSON-LD                 | Listele      |
| Kırık iç linkler (404)        | Tarama yap   |
| Yönlendirme zincirleri        | Tespit et    |
| Orphan pages (yetim sayfalar) | Listele      |

4. Bitki Veritabanı Kontrolleri

Özel olarak senin sistemin için:

* Bitki kayıt sayısı
* Eksik bilimsel adlar
* Eksik bakım bilgileri
* Eksik görseller
* Yinelenen (duplicate) kayıtlar
* Bozuk görsel URL'leri
* Kategorisiz bitkiler
* Etiketsiz bitkiler
* AI tarafından oluşturulan eksik alanlar

Örnek:

27 bitkide bakım bilgisi eksik
13 bitkide görsel bulunamadı
4 olası duplicate kayıt tespit edildi

5. E-Ticaret Kontrolleri

| Kontrol                      | Açıklama                    |
| ---------------------------- | --------------------------- |
| Sepete ekleme                | Test ürün ile dene          |
| Sepetten çıkarma             | Çalışıyor mu?               |
| Favori sistemi               | Çalışıyor mu?               |
| Varyant sistemi              | Fiyat değişiyor mu?         |
| Stok kontrolü                | Negatif stok var mı?        |
| Kargo hesaplama              | Doğru sonuç veriyor mu?     |
| Kupon sistemi                | Test kuponu ile dene        |
| Ödeme sağlayıcısı bağlantısı | Iyzico / Stripe / PayTR vb. |
| Sipariş oluşturma            | Test siparişi oluştur       |
| Sipariş maili                | Gönderiliyor mu?            |
| Kargo takip entegrasyonu     | Yanıt alıyor mu?            |

6. Blog Sistemi Kontrolleri

* Yeni yazı oluşturma
* Taslak kaydetme
* Yayınlama
* Güncelleme
* Silme
* Slug üretimi
* Otomatik iç linkleme
* AI SEO analizi
* JSON-LD üretimi
* Görsel optimizasyonu
* Okuma süresi hesaplama
* Arama indeksine ekleme

7. Sayfa ve Navigasyon Kontrolleri

Senin aklına gelen kısmı genişletiyorum:

| Kontrol               | Açıklama           |
| --------------------- | ------------------ |
| Ana sayfa             | 200 dönüyor mu?    |
| Ürün sayfaları        | 404 var mı?        |
| Kategori sayfaları    | 404 var mı?        |
| Blog yazıları         | 404 var mı?        |
| Bitki detay sayfaları | 404 var mı?        |
| Admin panel rotaları  | Yetki kontrolü     |
| Breadcrumb yapısı     | Doğru mu?          |
| Menü linkleri         | Kırık link var mı? |
| Footer linkleri       | Kırık link var mı? |

8. Güvenlik Kontrolleri

* APP_KEY mevcut mu?
* JWT_SECRET mevcut mu?
* CORS yapılandırması
* Rate limit aktif mi?
* Admin rotaları korunuyor mu?
* Debug modu kapalı mı? (production)
* HTTPS yönlendirmesi aktif mi?
* Güvenlik başlıkları (CSP, HSTS, X-Frame-Options)
* Şüpheli oturum denemeleri
* Bozuk yetki kontrolleri

9. Performans Testleri

Otomatik ölçümler:
Ana sayfa

### 1.2 sn

Açılış süresi

Blog sayfası

### 980 ms

Açılış süresi

Ürün sayfası

### 1.5 sn

Açılış süresi

API ortalama

### 230 ms

Yanıt süresi

Ek metrikler:

* En yavaş API endpoint'leri
* En yavaş SQL sorguları
* Cache hit oranı
* Görsel optimizasyon durumu
* Largest Contentful Paint tahmini
* TTFB (Time To First Byte)

10. Hata Merkezi (Error Center)

Son 24 saat / 7 gün / 30 gün filtreleri:

500 hataları
404 hataları
Yetki hataları (401/403)
API zaman aşımı hataları
AI servis hataları
SQL hataları
Görsel yükleme hataları
Mail gönderim hataları
Ödeme hataları
Kargo entegrasyon hataları

11. Önerdiğim Dashboard Tasarımı

### Sistem Doktoru

Tam Tarama Başlat
Son tarama: 26.06.2026 14:21
Genel Sağlık

### 92%

Mükemmel
Başarılı Test

### 118

Geçti
Uyarı

### 7

Dikkat gerekli
Kritik Hata

### 2

Müdahale gerekli

Canlı Durum

Veritabanı

Çalışıyor

AI Servisleri

Çalışıyor

Ödeme Sistemi

Çalışıyor

Blog Sitemap

Uyarı

13 Bozuk Görsel

Hata

AI Agent'e Verebileceğin Hazır Prompt

Bunu doğrudan AI Agent'e ver:

PROMPT

Projeye “Sistem Doktoru (System Doctor / Health Center)” adında gelişmiş bir yönetim bölümü ekle.

Amaç: Sistemdeki tüm modüllerin, entegrasyonların ve kritik işlevlerin çalışıp çalışmadığını otomatik olarak test etmek ve sonuçları görsel olarak raporlamak.

Kurallar:

* Her testin durumu: SUCCESS (yeşil), WARNING (turuncu), ERROR (kırmızı) olarak gösterilsin.

* Tüm testler tek tuşla “Tam Tarama Başlat” butonu ile çalışsın.

* Test sonuçları veritabanında saklansın.

* Son tarama zamanı gösterilsin.

* Kritik hatalar için üst kısımda uyarı kartı gösterilsin.

* Her modül kendi sekmesinde listelensin.

* Her test için: durum, açıklama, gecikme süresi, son başarılı çalışma zamanı ve hata mesajı gösterilsin.

Kontrol edilmesi gereken modüller:

1. Sistem Sağlığı

* Veritabanı bağlantısı

* Migration durumu

* CRUD testleri (Create/Read/Update/Delete)

* Dosya sistemi yazma izni

* Cache sistemi

* Queue sistemi

* Cron görevleri

* Disk alanı

* RAM kullanımı

* CPU yükü

2. AI Servisleri

* OpenRouter API

* Gemini API

* Mistral API

* OpenAI API

* Embedding servisi

* Reranking servisi

* AI SEO Copilot motoru

* İçerik üretim servisi

* Görsel üretim servisi

* PDF analiz servisi

3. SEO / GEO Kontrolleri

* robots.txt erişimi

* sitemap.xml erişimi

* Blog sitemap'i

* Ürün sitemap'i

* Canonical URL hataları

* Eksik meta title'lar

* Eksik meta description'lar

* Eksik Open Graph etiketleri

* Eksik JSON-LD

* Kırık iç linkler (404)

* Yönlendirme zincirleri

* Orphan pages (yetim sayfalar)

4. Bitki Veritabanı Kontrolleri

* Eksik bilimsel ad

* Eksik bakım bilgisi

* Eksik görsel

* Bozuk görsel URL'si

* Duplicate kayıtlar

* Kategorisiz bitkiler

* Etiketsiz bitkiler

5. E-Ticaret Kontrolleri

* Sepete ekleme

* Sepetten çıkarma

* Favori sistemi

* Varyant sistemi

* Stok kontrolü

* Kargo hesaplama

* Kupon sistemi

* Ödeme sağlayıcısı bağlantısı

* Test siparişi oluşturma

* Sipariş maili gönderimi

* Kargo takip entegrasyonu

6. Blog Sistemi

* Yazı oluşturma

* Taslak kaydetme

* Yayınlama

* Güncelleme

* Silme

* Slug üretimi

* Otomatik iç linkleme

* AI SEO analizi

* JSON-LD üretimi

* Görsel optimizasyonu

* Okuma süresi hesaplama

* Arama indeksine ekleme

7. Navigasyon ve Sayfalar

* Ana sayfa

* Ürün sayfaları

* Kategori sayfaları

* Blog yazıları

* Bitki detay sayfaları

* Admin panel rotaları

* Breadcrumb yapısı

* Menü linkleri

* Footer linkleri

8. Güvenlik Kontrolleri

* APP_KEY

* JWT_SECRET

* CORS yapılandırması

* Rate limit

* Admin rotalarının korunması

* Debug modu (production'da kapalı olmalı)

* HTTPS yönlendirmesi

* Güvenlik başlıkları (CSP, HSTS, X-Frame-Options)

9. Performans Analizi

* Ana sayfa yüklenme süresi

* Blog sayfası yüklenme süresi

* Ürün sayfası yüklenme süresi

* API ortalama yanıt süresi

* En yavaş endpoint'ler

* En yavaş SQL sorguları

* Cache hit oranı

* TTFB tahmini

10. Hata Merkezi

* 500 hataları

* 404 hataları

* 401/403 hataları

* API timeout hataları

* AI servis hataları

* SQL hataları

* Görsel yükleme hataları

* Mail gönderim hataları

* Ödeme hataları

* Kargo entegrasyon hataları

Arayüz Tasarımı

* Üstte “Genel Sağlık Skoru” (0-100) göster.

* Başarılı test sayısı, uyarı sayısı ve kritik hata sayısı için ayrı kartlar göster.

* Her modül kart şeklinde listelensin.

* Kartlarda ikon, durum rozeti ve kısa açıklama bulunsun.

* Canlı yenileme desteği ekle.

* Tarama sırasında ilerleme çubuğu göster.

* Kritik hatalar için “Hızlı Düzelt” butonları ekle (örn: cache temizle, queue yeniden başlat, sitemap yeniden oluştur).

Teknik Gereksinimler

* Tüm kontroller ayrı service sınıflarında olsun.

* Yeni kontrol eklemek kolay olsun.

* Testler paralel çalıştırılsın.

* Sonuçlar veritabanında saklansın.

* Geçmiş taramalar görüntülenebilsin.

* API endpoint: GET /api/system-doctor/scan ve GET /api/system-doctor/history.

* Sistem üretim ortamında güvenli şekilde çalışmalı.

Beklenen Sonuç

Bu özellik, projedeki tüm e-ticaret, blog, SEO, AI servisleri ve bitki veritabanı modüllerini tek ekrandan izleyen, otomatik hata tespiti yapan ve kritik sorunları anında gösteren profesyonel bir “Sistem Doktoru” merkezi oluşturmalı.

Ekstra Tavsiye (Çok Önemli)

Sisteme bir “Otomatik Günlük Tarama” eklet.

Önerim:

* Her gece 03:00'te tam tarama

* Kritik hata varsa Telegram / Discord / E-posta bildirimi

* 3 kez üst üste başarısız olan modülü “Kritik” seviyesine yükseltme

* Haftalık sağlık raporu PDF'i oluşturma

Bu, projeni amatör bir panelden çıkarıp gerçek bir SaaS seviyesine taşır.

En kritik ekleme (bence mutlaka olmalı)

“Kullanıcı Yolculuğu Testi” (User Journey Test) eklet.

Sistem otomatik olarak şunu denesin:

* Ana sayfaya git

* Bir kategori aç

* Bir ürün aç

* Sepete ekle

* Sepete git

* Ödeme sayfasına ilerle

* Test siparişi oluştur

* Sipariş mailini doğrula

* Sipariş durumunu kontrol et

Bu test geçiyorsa, e-ticaret sisteminin %90'ı gerçekten çalışıyor demektir.

İşte asıl “doktor” testi budur.
