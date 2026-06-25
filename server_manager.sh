#!/bin/bash

# Renk tanımlamaları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Scriptin root haklarıyla çalıştırılıp çalıştırılmadığını kontrol et
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Lütfen bu scripti root kullanıcısı ile veya 'sudo' kullanarak çalıştırın.${NC}"
  exit 1
fi

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  YEŞİL DÜKKAN - GELİŞMİŞ SUNUCU YÖNETİCİSİ (v2)    ${NC}"
echo -e "${GREEN}====================================================${NC}"

function show_menu() {
    echo ""
    echo -e "${CYAN}------------------ TEMEL İŞLEMLER ------------------${NC}"
    echo "1) 🚀 Sistemi İlk Kez Kur (Docker, Swap, Güvenlik, Deploy)"
    echo "2) 🔄 Sitenin Yeni Sürümünü Çek ve Güncelle (Git Pull & Build)"
    echo -e "${CYAN}------------------ GELİŞMİŞ ÖZELLİKLER -----------------${NC}"
    echo "3) 🔒 SSL (HTTPS) Sertifikası Kur (Let's Encrypt)"
    echo "4) 💾 Veritabanı ve Medya Yedekle (Backup Al)"
    echo "5) ♻️  Yedekten Geri Dön (Restore)"
    echo "6) 🛡️  Gelişmiş Güvenlik Kurulumu (Fail2Ban - Anti DDOS/BruteForce)"
    echo "7) ⚙️  Ayar (.env) Yöneticisi (Şifreleri ve Anahtarları Değiştir)"
    echo -e "${CYAN}------------- BAKIM VE SORUN GİDERME ---------------${NC}"
    echo "8) 🩺 Sistem Sağlığı ve Canlı Kaynak İzleme (RAM, CPU, Disk)"
    echo "9) 📋 Servis Loglarını Oku (Hata Takibi)"
    echo "10) 🧹 Acil Durum Temizliği (Önbellek ve Çöpleri Sil)"
    echo "11) ❌ Çıkış"
    echo ""
    read -p "Lütfen bir işlem seçin (1-11): " choice
    case $choice in
        1) install_system ;;
        2) update_system ;;
        3) setup_ssl ;;
        4) backup_system ;;
        5) restore_system ;;
        6) setup_security ;;
        7) env_manager ;;
        8) system_health ;;
        9) read_logs ;;
        10) emergency_repair ;;
        11) exit 0 ;;
        *) echo -e "${RED}Geçersiz seçim! Lütfen tekrar deneyin.${NC}"; show_menu ;;
    esac
}

function install_system() {
    echo -e "${YELLOW}>> 1. Aşama: Sistem güncelleniyor ve temel paketler kuruluyor...${NC}"
    apt update && apt upgrade -y
    apt install curl git ufw htop nano unzip jq -y

    echo -e "${YELLOW}>> 2. Aşama: Temel Güvenlik Duvarı (UFW) Ayarlanıyor...${NC}"
    ufw allow OpenSSH
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "y" | ufw enable

    echo -e "${YELLOW}>> 3. Aşama: 4GB Sanal Bellek (Swap) Ayarlanıyor...${NC}"
    if [ ! -f /swapfile ]; then
        fallocate -l 4G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
        echo -e "${GREEN}Swap başarıyla oluşturuldu.${NC}"
    else
        echo -e "${BLUE}Swap dosyası zaten mevcut, atlanıyor.${NC}"
    fi

    echo -e "${YELLOW}>> 4. Aşama: Docker ve Docker Compose Kuruluyor...${NC}"
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
        apt install docker-compose-plugin -y
        rm get-docker.sh
    else
        echo -e "${BLUE}Docker zaten kurulu.${NC}"
    fi

    echo -e "${YELLOW}>> 5. Aşama: Başlangıç Ayarları (.env)...${NC}"
    if [ ! -f .env ]; then
        read -p "Veritabanı için güvenli bir şifre belirleyin: " db_pass
        read -p "Sitenizin alan adı (Örn: https://benimsitem.com - Sonunda / olmasın): " site_url
        
        sed -i "s/supersecretpassword/$db_pass/g" docker-compose.yml
        sed -i "s|http://localhost|$site_url|g" docker-compose.yml
        echo -e "${GREEN}Başlangıç ayarları docker-compose.yml üzerine işlendi.${NC}"
    fi

    echo -e "${YELLOW}>> 6. Aşama: Proje İnşa Ediliyor ve Başlatılıyor (5-10 dk)...${NC}"
    docker compose up -d --build

    echo -e "${GREEN}Kurulum Tamamlandı!${NC}"
    show_menu
}

function update_system() {
    echo -e "${YELLOW}>> Yeni kodlar çekiliyor...${NC}"
    git pull origin main

    echo -e "${YELLOW}>> Konteynerler yeniden inşa ediliyor...${NC}"
    docker compose up -d --build
    
    echo -e "${GREEN}Eski gereksiz imajlar temizleniyor...${NC}"
    docker image prune -f
    
    echo -e "${GREEN}Güncelleme Tamamlandı!${NC}"
    show_menu
}

function setup_ssl() {
    echo -e "${YELLOW}>> Let's Encrypt ile Otomatik SSL Kurulumu...${NC}"
    read -p "Domain adresinizi girin (Örn: benimsitem.com): " domain_name
    read -p "E-posta adresinizi girin (Sertifika yenileme uyarıları için): " email_addr

    apt install certbot -y
    
    # Nginx reverse proxy için Docker'ı durdur
    docker compose down
    
    echo -e "${BLUE}Sertifika alınıyor... Lütfen bekleyin.${NC}"
    certbot certonly --standalone -d $domain_name -d www.$domain_name --non-interactive --agree-tos -m $email_addr
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Sertifika başarıyla oluşturuldu!${NC}"
        echo -e "${YELLOW}NOT: Lütfen frontend/nginx.conf dosyanızı SSL kullanacak şekilde güncellediğinizden emin olun.${NC}"
    else
        echo -e "${RED}Sertifika alınırken hata oluştu. Domain yönlendirmesini kontrol edin.${NC}"
    fi
    
    docker compose up -d
    show_menu
}

function backup_system() {
    BACKUP_DIR="/root/backups"
    mkdir -p $BACKUP_DIR
    DATE=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/backup_$DATE.tar.gz"

    echo -e "${YELLOW}>> Veritabanı ve Medya dosyaları yedekleniyor...${NC}"
    
    # DB dump (Varsayılan kullanıcı ve db isimlerini docker-compose.yml'den alıyoruz)
    docker exec cactus_care_postgres pg_dump -U yesil_admin yesil_dukkan > "$BACKUP_DIR/db_$DATE.sql"
    
    # Medya ve DB dosyasını arşivle
    tar -czvf $BACKUP_FILE "$BACKUP_DIR/db_$DATE.sql" backend/media/
    rm "$BACKUP_DIR/db_$DATE.sql"
    
    echo -e "${GREEN}Yedekleme başarılı! Dosya konumu: $BACKUP_FILE${NC}"
    show_menu
}

function restore_system() {
    BACKUP_DIR="/root/backups"
    echo -e "${CYAN}Mevcut Yedekler:${NC}"
    ls -lh $BACKUP_DIR/*.tar.gz 2>/dev/null
    
    read -p "Geri yüklemek istediğiniz yedeğin tam dosya adını yazın (veya iptal için boş bırakın): " backup_file
    
    if [ -n "$backup_file" ] && [ -f "$backup_file" ]; then
        echo -e "${YELLOW}>> Yedek dışarı çıkartılıyor...${NC}"
        tar -xzvf "$backup_file" -C /tmp/
        
        SQL_FILE=$(ls /tmp/root/backups/*.sql 2>/dev/null | head -n 1)
        
        if [ -n "$SQL_FILE" ]; then
            echo -e "${YELLOW}>> Veritabanı geri yükleniyor...${NC}"
            # Varolan tablo verilerini temizleyip yüklemek en sağlıklısı
            docker exec -i cactus_care_postgres psql -U yesil_admin -d yesil_dukkan -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
            cat "$SQL_FILE" | docker exec -i cactus_care_postgres psql -U yesil_admin -d yesil_dukkan
            echo -e "${GREEN}Veritabanı geri yüklendi!${NC}"
        fi
        
        echo -e "${YELLOW}>> Medya dosyaları geri yüklünüyor...${NC}"
        cp -r /tmp/backend/media/* backend/media/
        
        # Temizlik
        rm -rf /tmp/root /tmp/backend
        
        echo -e "${GREEN}Tüm geri yükleme işlemi başarıyla tamamlandı.${NC}"
    else
        echo -e "${RED}Geçersiz dosya veya iptal edildi.${NC}"
    fi
    show_menu
}

function setup_security() {
    echo -e "${YELLOW}>> Gelişmiş Güvenlik Kurulumu Başlıyor...${NC}"
    apt install fail2ban -y
    systemctl enable fail2ban
    systemctl start fail2ban
    
    echo -e "${GREEN}Fail2Ban başarıyla kuruldu. Artık SSH üzerinden yapılan kaba kuvvet (Brute-Force) şifre denemeleri otomatik olarak engellenecek.${NC}"
    show_menu
}

function env_manager() {
    echo -e "${CYAN}--- Çevre Değişkeni (ENV) Düzenleyici ---${NC}"
    nano docker-compose.yml
    echo -e "${YELLOW}>> Değişikliklerin aktif olması için servisler yeniden başlatılıyor...${NC}"
    docker compose up -d
    echo -e "${GREEN}Servisler güncellendi.${NC}"
    show_menu
}

function system_health() {
    echo -e "\n${BLUE}--- DİSK KULLANIMI ---${NC}"
    df -h /
    
    echo -e "\n${BLUE}--- BELLEK VE SWAP ---${NC}"
    free -m
    
    echo -e "\n${BLUE}--- ÇALIŞAN KONTEYNERLER VE KAYNAK TÜKETİMLERİ ---${NC}"
    docker stats --no-stream
    
    echo -e "\n${GREEN}Görünüm tamamlandı.${NC}"
    read -p "Menüye dönmek için Enter'a basın..."
    show_menu
}

function read_logs() {
    echo -e "${CYAN}Hangi servisin loglarını okumak istiyorsunuz?${NC}"
    echo "1) Backend (Python API)"
    echo "2) Frontend (React/Nginx)"
    echo "3) Veritabanı (Postgres)"
    read -p "Seçiminiz: " log_choice
    
    case $log_choice in
        1) docker logs --tail 100 -f cactus_care_backend ;;
        2) docker logs --tail 100 -f cactus_care_frontend ;;
        3) docker logs --tail 100 -f cactus_care_postgres ;;
        *) echo -e "${RED}Geçersiz seçim!${NC}" ;;
    esac
    
    show_menu
}

function emergency_repair() {
    echo -e "${RED}DİKKAT: Bu işlem kilitlenen sistemleri yeniden başlatır ve diskteki tüm çöp dosyaları (eski Docker imajları) temizler.${NC}"
    read -p "Devam etmek istiyor musunuz? (E/H): " confirm
    if [[ $confirm == [eE] || $confirm == [eE][vV][eE][tT] ]]; then
        echo -e "${YELLOW}>> Sistem durduruluyor...${NC}"
        docker compose down
        
        echo -e "${YELLOW}>> Disk temizliği yapılıyor...${NC}"
        echo "y" | docker system prune -a --volumes
        
        echo -e "${YELLOW}>> Sistem yeniden başlatılıyor...${NC}"
        docker compose up -d
        
        echo -e "${GREEN}Onarım ve temizlik tamamlandı!${NC}"
    else
        echo -e "${BLUE}İşlem iptal edildi.${NC}"
    fi
    show_menu
}

# Root yetkisiyle ilk çalıştırmada doğrudan menüyü göster
show_menu
