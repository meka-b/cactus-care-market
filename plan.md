# plan.md — Yeşil Dükkan (AI + SEO E‑Ticaret) Güncellenmiş Geliştirme Planı

## 1) Objectives
- ✅ **Tamamlandı (Phase 1):** PlantNet (görsel→bilimsel ad) + Mistral Pixtral (TR taksonomi/SEO içerik) çekirdeğini doğrulamak (POC).
- ✅ **Tamamlandı (Phase 2):** FastAPI+Mongo + React storefront/admin MVP’yi kurmak; İyzico Sandbox ödeme + Resend e‑posta + SEO (multi‑tag landing, JSON‑LD, canonical, sitemap/robots).
- ✅ **Tamamlandı (Phase 3):**
  - AI Ürün Ekle v2: **admin manuel ürün adı + görsel** → AI otomatik doldurur, tüm alanlar editable.
  - `pot_size` (saksı çapı) + wishlist + reviews(+moderasyon) + kuponlar + GA4 no‑op + Blog CMS + EditorJS + AI Blog SEO.
  - Phase 3 E2E: **Backend 58/58 + Frontend 100%**.
- ✅ **Tamamlandı (Phase 4): Production Quality + Mobile App Feel + Yönetilebilir Konfig + Yaver Chatbot**
  - Admin ürün düzenleme, menü/ayar yönetimi (dinamik API key), sticky filters + stok filtresi, blog redesign + EditorJS, Yaver Chatbot, global mobile overflow fix, multi-image upload + alt text.
- ✅ **Tamamlandı (Phase 7): Ürün Görsel Deneyimi (Embla + 4:5 + Desktop Sticky Gallery)**
  - Mobile: Embla Carousel (swipe) + thumb strip + sayaç.
  - Global: 4:5 aspect ratio standardı (1080×1350 referans) product kartları ve ürün detay görsellerinde.
  - Desktop: Sticky sol galeri (hero + 2 kolon grid) + sağ metin kolonu scroll.
  - **Önemli UX kuralı:** Sol galeride **iç scrollbar yok**, çift scroll tamamen kaldırıldı.

---

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): PlantNet + Mistral + Görsel Optimizasyon ✅
**Durum:** Tamamlandı.

**User stories**
1. Admin olarak tek bir bitki fotoğrafı verip PlantNet’ten bilimsel adı alabilmek istiyorum.
2. Admin olarak bilimsel ad + görsel ile Pixtral’dan Türkçe kategori/bakım/SEO alanlarını JSON olarak almak istiyorum.
3. Admin olarak AI çıktısının enum değerlerine uyduğunu doğrulayabilmek istiyorum.
4. Admin olarak webp + 1600px + 400px thumb çıktılarının oluştuğunu görmek istiyorum.

**Deliverables**
- Çalışan POC scripti + örnek JSON çıktıları.

---

### Phase 2 — V1 App Development (Core etrafında MVP) ✅
**Durum:** Tamamlandı.

**User stories**
1. Ziyaretçi olarak ana sayfada kategorileri ve öne çıkan ürünleri mobilde rahatça gezmek istiyorum.
2. Ziyaretçi olarak landing sayfalarında filtreli ürünleri listelemek istiyorum.
3. Müşteri olarak sepete ekleyip checkout’a giderek İyzico Sandbox ile ödeme yapabilmek istiyorum.
4. Admin olarak AI önerisini görüp onaylayarak ürünü yayına alabilmek istiyorum.

**Notlar / Progress**
- ✅ Demo ürünler eklendi.
- ✅ İyzico sandbox base_url protokol hatası fixlendi.

---

### Phase 3 — Genişletilmiş Özellikler (AI Add v2 + Pot Size + Wishlist + Reviews + Coupons + GA + Blog CMS) ✅
**Durum:** Tamamlandı.

**Kapsam Özeti**
- AI Ürün Ekle v2 (manuel ad + görsel)
- `pot_size` (7 enum)
- Wishlist (kalp ikonu + favorilerim)
- Reviews (pending→admin moderation)
- Kuponlar (percentage/fixed/free_shipping) + checkout entegrasyonu
- GA4 entegrasyonu (ID boşsa no‑op)
- Blog CMS (public+admin) + EditorJS + BlogRenderer
- AI Blog SEO asistanı (meta/slug/tags/outline)

**Phase exit**
- ✅ Phase 3 regression: Backend 58/58, Frontend 100%

---

### Phase 4 — Production Quality + Mobile App Feel + Yönetilebilir Konfig + Yaver Chatbot ✅
**Durum:** Tamamlandı.

**Kapsam (özet)**
- Dinamik ayarlar: API key’ler admin panelden düzenlenebilir (DB settings → ENV fallback).
- Yaver Chatbot (müşteri destek + bakım önerileri).
- Mobil UX iyileştirmeleri, yatay scroll (overflow-x) problemi global fix.
- Multi-image upload altyapısı + AI alt text generation.

**Phase exit**
- ✅ Stabil storefront/admin, ödeme & e‑posta akışları korunur.

---

### Phase 7 — Ürün Görsel Deneyimi (Embla + 4:5 + Desktop Sticky Gallery) ✅
**Durum:** Tamamlandı.

**User stories**
1. Mobilde ürün görsellerini parmakla kaydırarak (touch swipe) gezmek istiyorum.
2. Tüm ürün kartları ve ürün görsellerinin oranı 4:5 (1080×1350) standardında olmalı.
3. Desktop'ta ürün detay sayfasında **sağ taraftaki ürün bilgileri sticky** kalsın; sol galeri sayfa ile birlikte normal scroll etsin (Sepete Ekle butonu hep görünür).
4. Sol galeride **iç scrollbar** olmamalı; çift scroll deneyimi tamamen kaldırılmalı.

**Frontend (gerçeklenen)**
- `src/components/ProductGallery.jsx`
  - Mobile (`lg:hidden`): Embla carousel + thumb strip + prev/next + counter
  - Desktop (`lg:block`): Hero (ilk görsel) + kalan görseller 2 kolon grid
  - Tüm görseller: `aspectRatio: '4 / 5'` + `object-cover`
- `src/components/ProductCard.jsx`
  - Görsel kapsayıcı: `style={{ aspectRatio: '4 / 5' }}` + `object-cover`
- `src/pages/ProductPage.jsx`
  - Sol galeri sarmalayıcı: normal akış (sticky yok)
  - Sağ ürün info sarmalayıcı: `lg:sticky lg:top-20 self-start` (`data-testid="product-info-sticky"`) — galeri scroll edilirken Sepete Ekle dahil bilgiler viewport'ta sabit kalır.

**Bugfix (kullanıcı geri bildirimi)**
- Problem: Product Detail Page sol galeride iç scrollbar görünüyordu.
- Kaynak: `lg:max-h-*` + `lg:overflow-y-auto` kombinasyonu.
- Çözüm: Gallery wrapper’dan bu sınıfların kaldırılması.

**Doğrulama (kanıt)**
- Desktop computed style: `overflowY=visible`, `maxHeight=none`, `position=sticky`, `top=80px` ✅
- Mobile: horizontal scroll yok; Embla + thumb + counter çalışıyor ✅
- 4:5 ratio görsellerde doğru render ✅

**Phase exit**
- ✅ Ürün görsel deneyimi kuralları tamamlandı; iç scrollbar/çift scroll kaldırıldı.

---

## 3) Next Actions (Immediate)
1. **Regresyon testi (öneri):** `testing_agent_v3` ile hızlı smoke/regression:
   - Ürün listeleme → ürün detay → sepete ekle → sepet → checkout (İyzico sandbox)
   - Mobil: Embla swipe + thumb seçim, görsel oranları, yatay scroll kontrolü
   - **Mobile Tabs (Embla):** swipe + auto-scroll-to-active davranışı
2. **UI polish (opsiyonel):** Desktop sticky davranışı için uzun galeri senaryolarında beklenti netleştirme.
3. (Opsiyonel) `server.py` refactor.

---

### Phase 8 — Mobile Tabs (Embla) + Branding Cleanup ✅
**Durum:** Tamamlandı.

**User stories**
1. Ürün detay sayfasındaki tab list, mobilde yatay overflow yapmamalı; tüm tablar erişilebilir olmalı.
2. Kullanıcı sağa-sola swipe yaparak görünmeyen tablara ulaşabilmeli.
3. Aktif tab değişince ilgili buton otomatik olarak görünür alana kaydırılmalı.
4. Yatay scrollbar görünmemeli, responsive yapı korunmalı.
5. "Made with Emergent" badge'i tüm projeden kaldırılmalı.

**Frontend (gerçeklenen)**
- `src/components/MobileTabsBar.jsx` (yeni):
  - Embla Carousel (`align: 'start'`, `containScroll: 'trimSnaps'`, `dragFree: true`).
  - `useEffect`: active prop değişince `emblaApi.scrollTo(idx)` + `scrollIntoView({block:'nearest', inline:'center'})` fallback.
  - `data-testid="mobile-tabs-bar"` + her tab için `data-testid="mobile-tab-<value>"`.
- `src/pages/ProductPage.jsx`:
  - `<Tabs>` controlled hâle getirildi (`value={activeTab}` + `onValueChange={setActiveTab}`).
  - Mobile (`lg:hidden`): `<MobileTabsBar tabs=[...] active onSelect />`.
  - Desktop (`hidden lg:inline-flex`): standart `<TabsList>` + `<TabsTrigger>`.
- `public/index.html`: `<a id="emergent-badge">…Made with Emergent…</a>` bloğu tamamen kaldırıldı.

**Doğrulama (kanıt)**
- Mobile (390px): horizontal page scroll yok; tab bar inner `overflow: hidden`; 4 tab; desktop TabsList `display: none`.
- "Kargo & İade" tabına tıklayınca: `data-state=active`, aktif panel "Kargo: Siparişiniz..." metnini gösteriyor, buton `fullyInside: true` olarak viewport içine kaydırıldı.
- "İncelemeler" tabına tıklayınca: aktif panel ProductReviews içeriği. Auto-scroll-to-active çalışıyor.
- `document.getElementById('emergent-badge')` → null (REMOVED).

**Phase exit**
- ✅ Mobil tab list modern mobil davranışıyla (Embla swipe + auto-scroll) tamamlandı; branding badge kaldırıldı.

---

### Phase 9 — Product Bundle / "Birlikte Al" Modülü ✅
**Durum:** Tamamlandı.

**User stories**
1. Ürün detay sayfasında "Güvenli Ödeme" altında Amazon/Trendyol benzeri bir Birlikte Al modülü görünür.
2. Admin panelinden 5 farklı tipte kampanya tanımlanabilir.
3. Birlikte Al butonuyla tüm seçili ürünler bundle olarak sepete eklenir; sepette kampanya etiketi ve indirim ayrı kalem olarak görünür.
4. Bundle aktifken kupon kodu uygulanmaz (kullanıcıya uyarı).
5. Geri sayım sayacı (saat:dk:sn) canlı çalışır.
6. Bundle ürünleri için stok kontrolü ayrı ayrı yapılır.

**Backend (gerçeklenen)**
- `models.py`: `Campaign`, `CampaignCreate`, `CampaignUpdate`, `BundleCalcRequest`, `QuantityTier` + `OrderItem.campaign_id`, `Order.bundle_discount/applied_campaign_ids` alanları, `CheckoutRequest.applied_campaigns`.
- `campaign_service.py`: 5 tip için hesap (`fixed_bundle`, `percentage_bundle`, `fixed_amount_bundle`, `buy_x_get_y`, `quantity_break`), öncelik + çakışma + stok kontrolü içeren `validate_and_calc_for_cart`, hidratlanmış ürünlerle `hydrate_campaign_products`, tarih kontrolü `is_campaign_live`.
- `server.py`: 
  - `GET/POST/PATCH/DELETE /api/admin/campaigns`
  - `GET /api/campaigns/for-product/{product_id}` (public, hidratlı)
  - `POST /api/campaigns/calculate` (public, anlık hesap)
  - `GET /api/admin/products/by-id/{id}` (admin picker hidratlama)
  - `POST /api/orders/checkout` güncellendi: bundle indirimi + kupon çakışma engeli (bundle aktifse kupon iptal edilir).

**Frontend Storefront (gerçeklenen)**
- `components/BundleModule.jsx`: 
  - Horizontal product rows (max 3) + "+" separator
  - Checkbox seçim (ana ürün disabled)
  - Canlı geri sayım hook (`useCountdown`)
  - Stokta yok badge + CTA disable + uyarı kartı
  - Normal/Kampanya/Birlikte Fiyat özeti
  - Backend `/campaigns/calculate` ile doğrulama
- `lib/cart.jsx`: `bundles` state, `addBundle`, `removeBundle`, `bundleDiscount`, `hasBundles`.
- `components/CartDrawer.jsx`: Bundle grup gösterimi (kart içinde + indirim satırı + X ile kaldır).
- `pages/CheckoutPage.jsx`: Bundle indirim satırı + bundle varken kupon disabled + uyarı + payload'a `applied_campaigns` ekledi.
- `pages/ProductPage.jsx`: `<BundleModule productId={product.id} />` "Güvenli Ödeme" altına eklendi.

**Frontend Admin (gerçeklenen)**
- `pages/admin/AdminCampaigns.jsx`: 
  - Liste sayfası: aktif badge, tip+değer, öncelik, tarih, ek ürün sayısı, edit/delete.
  - Type-aware Dialog: tipe göre alanlar dinamik gösterilir (`fixed_bundle` → bundle_price, `percentage_bundle` → %, `fixed_amount_bundle` → ₺, `buy_x_get_y` → free product + qty, `quantity_break` → kademeli tiers ekle/sil).
  - `ProductPicker` (single/multi): debounce'lı arama, badge'le seçim, by-id hidratlama.
- `pages/admin/AdminLayout.jsx`: Sidebar + mobile nav'a "Kampanyalar" linki.
- `App.js`: `/admin/kampanyalar` route'u eklendi.

**Doğrulama (kanıt)**
- Backend tüm 5 tip için doğru hesap (curl + service test):
  - fixed_bundle: 999.90 → 849.91 (-149.99)
  - percentage_bundle (%25): -249.97 → 749.92
  - fixed_amount_bundle (-₺200): 999.90 → 799.90
  - buy_x_get_y (REL ücretsiz): -249.90 → 750.00
  - quantity_break (3 adet %15): 2250.00 → 1912.50
- Backend checkout: bundle_discount kaydedildi (149.99), applied_campaign_ids[] dolu, kupon (`YESIL10`) gönderilse bile bundle aktifken iptal edildi (coupon_code=null, discount=0).
- Frontend desktop: Bundle modülü render edildi, canlı sayaç `23:59:40`, "Birlikte Al" → toast + cart drawer açıldı, bundle 2 ürünüyle grup olarak göründü, -149.99 indirim ayrı satır.
- Frontend mobile (390px): Horizontal scroll yok, kart fit, 4:5 görseller, CTA full-width.
- Admin: Liste sayfası ve type-aware Dialog ekran görüntüleriyle doğrulandı.

**Phase exit**
- ✅ Tüm 5 tip backend + frontend tarafında çalışır.
- ✅ Bundle/kupon çakışma engeli aktif.
- ✅ Stok kontrolü bundle bazında uygulanır.
- ✅ Canlı geri sayım çalışır.

---

## 4) Success Criteria
- ✅ Phase 1-4 başarı kriterleri korunur (POC + MVP + genişletmeler stabil).
- ✅ Phase 7:
  - Mobile Embla carousel sorunsuz (swipe + thumb + sayaç).
  - Tüm product card ve ürün detay görselleri 4:5 standardında, distortion yok (`object-cover`).
  - Desktop’ta sol galeri sticky çalışır.
  - **Sol galeride iç scrollbar yok**, çift scroll deneyimi tamamen kaldırılmıştır.
  - Mobilde yatay scroll (horizontal overflow) oluşmaz.
