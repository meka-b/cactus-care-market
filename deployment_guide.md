# Hostinger KVM 2 VPS Üzerine Proje Dağıtım (Deploy) Rehberi

Bu rehber, daha önce hiç sunucu (VPS) yapılandırması ve proje deploy (canlıya alma) işlemi yapmamış biri için adım adım hazırlanmıştır. **Cactus Care Market** projenizi Hostinger'in "KVM 2" VPS planını kullanarak yayına alacağız.

> [!IMPORTANT]
> Tüm adımları atlamadan, sırasıyla ve dikkatlice uygulayın. Terminal ekranında kod yazarken kopyala-yapıştır yapmanız önerilir.

---

## Aşama 1: Hostinger VPS Satın Alma ve Ön Hazırlık

### 1. VPS Planını Kurma
1. Hostinger paneline giriş yapın ve **KVM 2** paketini (veya üstünü) satın alın.
2. Kurulum ekranında İşletim Sistemi (OS) olarak **Ubuntu 24.04 64-bit** veya **Ubuntu 22.04 64-bit** (Plain/Sade versiyon) seçin. (Herhangi bir panel seçmeyin, düz Ubuntu yeterlidir).
3. Sizden bir "root" şifresi belirlemeniz istenecektir. Zor ve güvenli bir şifre belirleyin. Bu şifreyi **asla kaybetmeyin**.
4. Sunucu kurulduğunda size özel bir **IP Adresi** verilecektir. (Örn: `192.168.1.50`).

### 2. Domain (Alan Adı) Yönlendirme
1. Hostinger veya domaini satın aldığınız firmanın paneline gidin (DNS Yönetimi).
2. Domaininiz için bir **A Kaydı** (A Record) oluşturun.
3. Ad / İsim (Name) kısmına `@` yazın.
4. Hedef / İçerik (Target) kısmına **VPS IP Adresinizi** yapıştırın ve kaydedin.
5. (İsteğe bağlı) Başına "www" eklendiğinde de çalışması için bir tane daha **A Kaydı** açın, ismine `www` yazın, hedefe yine sunucu IP adresini yapıştırın.

---

## Aşama 2: Sunucuya Bağlanma ve Güvenlik Duvarı Ayarları

Bilgisayarınızdan sunucuya uzaktan bağlanıp kod yazabilmeniz için Terminal (MacOS/Linux) veya PowerShell / Putty (Windows) kullanacağız.

1. Bilgisayarınızda **Windows PowerShell** uygulamasını açın.
2. Aşağıdaki komutu yazarak sunucunuza bağlanın (IP adresini kendi VPS IP'nizle değiştirin):
```bash
ssh root@SUNUCU_IP_ADRESINIZ
```
3. "Are you sure you want to continue connecting?" sorusuna **yes** yazıp Enter'a basın.
4. Hostinger'da belirlediğiniz root şifrenizi girin. (Şifreyi yazarken ekranda karakterler görünmez, bu normaldir. Yazıp Enter'a basın.)

Artık sunucunun içindesiniz! Şimdi güvenlik duvarını (Firewall) ayarlayalım:

```bash
# Sadece gerekli portların (Bağlantı, Web, Güvenli Web) dışarıya açılması
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp

# Güvenlik duvarını aktif etme (Çıkan soruya y yazıp Enter deyin)
ufw enable
```

---

## Aşama 3: Gerekli Yazılımların (Docker) Kurulması

Projemiz Docker mimarisiyle hazırlandığı için sunucunun içine sadece Docker ve Docker Compose kurmamız yeterlidir; Python, Node.js veya veritabanını ayrıca kurmaya gerek kalmaz.

Sırasıyla aşağıdaki komutları çalıştırın (kopyalayıp sağ tık ile terminale yapıştırın):

```bash
# Sistem paketlerini güncelleme
apt update && apt upgrade -y

# Docker'ın otomatik kurulum dosyasını indirme ve çalıştırma
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker arka plan servisini başlatma
systemctl enable docker
systemctl start docker

# Docker Compose uygulamasını kurma
apt install docker-compose-plugin -y
```

> [!TIP]
> Kurulum başarıyla bittiğinde `docker --version` yazdığınızda Docker versiyonunuz ekranda görünmelidir.

---

## Aşama 4: Projeyi Sunucuya Aktarma

Kodlarınızı sunucuya çekmenin en profesyonel yolu Github kullanmaktır.

1. Projenizi bilgisayarınızda bir **Gizli (Private)** Github Repository'sine yükleyin.
2. Sunucuda projenin duracağı klasöre gidin ve kodları çekin:
```bash
cd /opt
git clone https://github.com/KULLANICI_ADINIZ/cactus-care-market-main.git
cd cactus-care-market-main
```
*(Git clone işlemi sırasında size Github kullanıcı adınızı ve şifrenizi/tokenınızı soracaktır).*

---

## Aşama 5: Canlı Ortam Ayarları (Environment Variables)

Projenizi sunucuda çalıştırırken "localhost" veya geliştirme şifreleri yerine gerçek şifreler ve alan adı kullanmalısınız.

1. Sunucuda proje klasörünün içindeyken ayar dosyasını düzenleyin:
```bash
nano docker-compose.yml
```
2. Bu dosyanın içinde bulunan şifreleri ve alan adlarını canlıya göre uyarlayın:
   - `POSTGRES_PASSWORD` değerini karmaşık bir şifre ile değiştirin (Örn: `MySecureDbPass123`).
   - `DATABASE_URL` içindeki şifre kısmını (`supersecretpassword`) yukarıda belirlediğiniz yeni veritabanı şifresiyle değiştirin.
   - `JWT_SECRET` değerine rastgele ve çok uzun bir metin girin.
   - `PUBLIC_URL` değerini `http://localhost` yerine `https://sizin-domaininiz.com` yapın.

3. Değişiklikleri kaydetmek için klavyede sırasıyla şu tuşlara basın: 
   - `CTRL + X` 
   - `Y`
   - `Enter`

---

## Aşama 6: Projeyi Başlatma

Ayarlarımız hazır! Artık Docker'a projeyi inşa etmesini ve başlatmasını söyleyebiliriz.

Terminalde şu komutu çalıştırın:
```bash
docker compose up -d --build
```
> [!NOTE]
> Bu işlem projeyi sıfırdan derleyeceği için (veritabanı kurulumu, arka yüz paketlerinin indirilmesi ve ön yüzün inşa edilmesi) sunucunun gücüne bağlı olarak **5-10 dakika** sürebilir. Lütfen bitene kadar terminali kapatmayın.

İşlem tamamlandığında projeniz `http://sizin-domaininiz.com` adresinde yayında olacaktır!

---

## Aşama 7: SSL Sertifikası Kurulumu (Güvenli Site - HTTPS)

Sitenizin sol üstünde "Güvenli Değil" yazmaması için ücretsiz SSL sertifikası (Let's Encrypt) kurmalıyız. Projemizde halihazırda Nginx çalıştığı için certbot kullanabiliriz.

Bunun için en iyi yöntem sunucuya certbot kurup Nginx kapsayıcısına sertifika sağlamaktır, ancak projemizde Nginx doğrudan Docker içinde (frontend servisinde) çalıştığı için en pratik yöntem Certbot'u ana makineye (VPS) kurup port yönlendirmesi yapmaktır:

1. Ana makinede Nginx ve Certbot kuralım:
```bash
apt install nginx python3-certbot-nginx -y
```

2. Siteniz için sertifika oluşturun:
```bash
certbot --nginx -d sizin-domaininiz.com -d www.sizin-domaininiz.com
```
Bunu çalıştırdığınızda size e-posta adresinizi soracaktır. Kurulum bitince trafiği otomatik HTTPS'e yönlendirsin mi diye sorarsa "2" yi (Redirect) seçin.

> [!WARNING]
> Eğer Certbot ana makinedeki Nginx'i kullanacaksa, Docker içindeki projenizin `docker-compose.yml` dosyasındaki `ports: - "80:80"` kısmını değiştirmemiz gerekir (Örneğin: `ports: - "3000:80"`). Bu sayede ana makinedeki nginx gelen trafiği karşılar ve 3000 portundaki Docker projenize güvenli bir şekilde aktarır.

### SSL için Alternatif ve En Kolay Yöntem (Cloudflare)
Eğer sunucu ayarlarıyla uğraşmak istemiyorsanız, domaininizi **Cloudflare** üzerinden yönlendirin. Cloudflare, domain ayarlarından "SSL/TLS -> Flexible" seçeneğini aktif ettiğiniz an tüm sitenizi otomatik olarak tek tıkla SSL'li (HTTPS) hale getirir ve sunucuda işlem yapmanıza gerek kalmaz. Sadece "Aşama 6" ya kadar gelmeniz yeterlidir.

---

## Yararlı Komutlar

İleride sitenizi yönetirken işinize yarayacak Docker komutları:

- **Sistemin çalışıp çalışmadığını görmek için:**
  `docker compose ps`
- **Tüm sistemi kapatmak için:**
  `docker compose down`
- **Sistemi arka planda tekrar açmak için:**
  `docker compose up -d`
- **Arka yüz (Backend) loglarını / hatalarını canlı izlemek için:**
  `docker logs -f cactus_care_backend`
- **Sitede kod değişikliği yaparsanız güncellemeyi canlıya almak için:**
  `git pull`
  `docker compose up -d --build`

Tebrikler! Modern bir web projesini baştan sona canlı sunucuya kurmayı başardınız. 🚀
