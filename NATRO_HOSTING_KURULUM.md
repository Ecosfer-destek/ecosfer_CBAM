# Ecosfer SKDM v2.0 - Natro Hosting Kurulum Rehberi

> **Proje:** Next.js 16 + PostgreSQL 16 + Redis 7 + .NET 9 + Python FastAPI
> **Hedef:** Natro Hosting Cloud Server üzerinde subdomain ile yayına alma
> **Kaynak:** https://www.natro.com/sunucu-kiralama/cloud-server-config

---

## İçindekiler

1. [Proje Özeti ve Mimari](#1-proje-özeti-ve-mimari)
2. [Natro XCloud Paketleri ve Karşılaştırma](#2-natro-xcloud-paketleri-ve-karşılaştırma)
3. [Projenin Kaynak İhtiyacı Analizi](#3-projenin-kaynak-ihtiyacı-analizi)
4. [Paket Önerileri](#4-paket-önerileri)
5. [Natro'dan Sipariş Verme](#5-natrodan-sipariş-verme)
6. [Subdomain Oluşturma ve DNS Ayarları](#6-subdomain-oluşturma-ve-dns-ayarları)
7. [VPS Sunucuya İlk Bağlantı](#7-vps-sunucuya-ilk-bağlantı)
8. [Sunucu Hazırlığı](#8-sunucu-hazırlığı)
9. [Proje Dosyalarını Sunucuya Yükleme](#9-proje-dosyalarını-sunucuya-yükleme)
10. [Ortam Değişkenlerini Yapılandırma](#10-ortam-değişkenlerini-yapılandırma)
11. [Docker ile Uygulamayı Başlatma](#11-docker-ile-uygulamayı-başlatma)
12. [Nginx Reverse Proxy ve SSL Ayarları](#12-nginx-reverse-proxy-ve-ssl-ayarları)
13. [Veritabanı Kurulumu ve Seed](#13-veritabanı-kurulumu-ve-seed)
14. [Doğrulama ve Test](#14-doğrulama-ve-test)
15. [Bakım ve İzleme](#15-bakım-ve-izleme)
16. [Sorun Giderme](#16-sorun-giderme)
17. [Hızlı Referans](#17-hızlı-referans)

---

## 1. Proje Özeti ve Mimari

### Ecosfer SKDM v2.0 Nedir?

**CBAM (Carbon Border Adjustment Mechanism)** Sürdürülebilirlik Karbon Düzenleme Mekanizması Paneli.
AB CBAM regülasyonuna uyum için tesis emisyon verileri yönetimi, düzenleyici beyanname oluşturma,
tedarikçi yönetimi ve yapay zeka destekli analiz platformu.

### Teknoloji Yığını

| Katman | Teknoloji | Sürüm | Açıklama |
|--------|-----------|-------|----------|
| **Frontend** | Next.js (App Router) | 16.1.6 | React 19, Server Components, TypeScript |
| **UI** | shadcn/ui + Tailwind CSS | 4.x | Radix UI, Recharts, TanStack Table |
| **ORM** | Prisma | 7.3.0 | 82 model, multi-tenant row-level isolation |
| **Veritabanı** | PostgreSQL | 16 | Ana veri deposu |
| **Cache** | Redis | 7 | Oturum ve önbellek |
| **Doküman Servisi** | .NET 9 Minimal API | 9.0 | Excel import/export, XML, PDF |
| **AI Servisi** | Python FastAPI | 3.13+ | XGBoost, IsolationForest, LangChain |
| **Reverse Proxy** | Nginx | latest | Rate limiting, SSL, güvenlik başlıkları |
| **Auth** | NextAuth.js | v5 beta | 6 rol: SuperAdmin, CompanyAdmin, Operator, Declarant, Verifier, Supplier |
| **i18n** | next-intl | 4.8.2 | Türkçe, İngilizce, Almanca |

### Çalışan Docker Container'lar (6 adet)

```
+-----------------------------------------------------------+
|                    Docker Network                          |
|                                                           |
|  +-----------+  +-------+  +--------+  +------+  +-----+ |
|  | Next.js   |  | .NET  |  | Python |  | Post |  | Red | |
|  | Frontend  |  | Docs  |  | AI/ML  |  | greSQL|  | is  | |
|  | :3000     |  | :5100 |  | :8000  |  | :5432 |  |:6379| |
|  +-----------+  +-------+  +--------+  +------+  +-----+ |
|                                                           |
+-----------------------------------------------------------+
         |
    +---------+
    |  Nginx  |  :80 / :443
    +---------+
         |
    [Internet]
```

### Servis Detayları

#### Next.js Frontend (Port 3000)
- Dashboard, tesis yönetimi, emisyon veri girişi
- CBAM beyanname sihirbazı (7 adım)
- Tedarikçi portali
- Server Actions ile CRUD işlemleri

#### .NET 9 Doküman Servisi (Port 5100)
- **Excel Import:** 5 sayfa (A_InstData, B_EmInst, C_Emissions, D_Processes, E_PurchPrec), 85+ hücre eşlemesi
- **Excel Export:** Tesis verilerini Excel'e aktarma
- **XML Üretimi:** CBAM beyanname XML'i, XSD doğrulama, SHA-256 bütünlük hash'i
- **PDF Rapor:** 5 rapor türü (Tesis Özeti, Beyanname, Emisyon Detay, Tedarikçi, Özel), TR/EN/DE

#### Python FastAPI AI Servisi (Port 8000)
- **Emisyon Tahmini:** XGBoost + LinearRegression fallback, 6-24 dönem, güven aralıkları
- **Anomali Tespiti:** IsolationForest + kural tabanlı hibrit yaklaşım
- **Rapor Narratifi:** LangChain (Claude/GPT-4) + şablon tabanlı fallback

#### PostgreSQL 16 (Port 5432)
- 82 Prisma modeli
- 27 tenant-scoped model (multi-tenant row-level isolation)
- Ülkeler, CN kodları, CBAM referans verileri

#### Redis 7 (Port 6379)
- Oturum yönetimi
- Önbellek katmanı
- Pub/Sub hazır

---

## 2. Natro XCloud Paketleri ve Karşılaştırma

> **Kaynak:** https://www.natro.com/sunucu-kiralama/vps-cloud-server
> **Özel Konfigürasyon:** https://www.natro.com/sunucu-kiralama/cloud-server-config

### Hazır XCloud Paketleri

| Paket | vCPU | RAM | Disk | Aylık Fiyat | İndirim | Projeniz İçin |
|-------|------|-----|------|-------------|---------|---------------|
| XCloud Mini | 1 Core | 1 GB | 20 GB SSD | ~$7/ay | %31 | YETERSIZ |
| XCloud Small | 1 Core | 2 GB | 40 GB SSD | ~$14/ay | %38 | YETERSIZ |
| **XCloud Medium** | **2 Core** | **4 GB** | **60 GB SSD** | **~$31/ay** | **%68** | **MINIMUM** |
| **XCloud Large** | **2 Core** | **6 GB** | **100 GB SSD** | **~$43/ay** | **%70** | **ONERİLEN** |
| **XCloud Pro** | **4 Core** | **8 GB** | **200 GB SSD** | **~$72/ay** | **%58** | **İDEAL** |
| XCloud Pro+ | 4 Core | 12 GB | 300 GB SSD | ~$100/ay | %65 | Fazla |
| XCloud Ultra | 8 Core | 32 GB | 600 GB SSD | ~$190/ay | %68 | Fazla |
| XCloud Ultra+ | 16 Core | 64 GB | 1 TB SSD | ~$360/ay | %72 | Fazla |

### Tüm Paketlerde Standart Özellikler

- 100 Mbit sınırsız trafik
- 1 adet statik IP adresi
- Ücretsiz yedekleme hizmeti
- Kolay yönetim paneli
- 7/24 DDoS koruması
- %99.9 uptime garantisi
- İlk 3 ay Plesk Panel ve Windows Lisans ücretsiz (kampanya)
- %100 SSD teknolojisi

### Özel Konfigürasyon (cloud-server-config)

`/cloud-server-config` sayfası size ihtiyacınız kadar kaynak seçme esnekliği sağlar.
Hazır paketlere uymuyorsanız burada CPU, RAM ve disk miktarını kendiniz belirleyebilirsiniz.

**Önerilen özel konfigürasyon:**
- **CPU:** 2 vCPU (minimum) / 4 vCPU (ideal)
- **RAM:** 4 GB (minimum) / 6-8 GB (ideal)
- **Disk:** 60 GB SSD (minimum) / 100 GB SSD (ideal)
- **İşletim Sistemi:** Ubuntu 22.04 LTS veya Ubuntu 24.04 LTS

### Natro Diğer Sunucu Seçenekleri (Referans)

| Tür | Başlangıç Fiyatı | Özellikler | Projeniz İçin |
|-----|-------------------|------------|---------------|
| **XCloud (VPS)** | ~$7/ay | 1-16 Core, 1-64 GB RAM, SSD | Uygun (doğru pakette) |
| **VDS Server** | ~$30/ay | 4+ vCPU, 8+ GB RAM, SSD | Uygun |
| **Dedicated Server** | ~$170/ay | Intel Xeon, 32 GB DDR4, 2x480 SSD | Gereksiz (fazla) |
| **Xtreme Server** | ~$98/ay | Intel Xeon-Silver 16-core, 32 GB | Gereksiz (fazla) |
| **Shared Hosting** | ~$1/ay | cPanel, sınırlı kaynak | UYGUN DEGİL |

> **Neden Shared Hosting olmaz?** Shared hosting'te Docker çalıştıramazsınız,
> root erişimi yoktur, PostgreSQL/Redis kuramazsınız. Mutlaka VPS/Cloud Server gerekir.

---

## 3. Projenin Kaynak İhtiyacı Analizi

### Container Bazında RAM Kullanımı

| Container | Min RAM | Normal RAM | Yoğun Kullanım | Açıklama |
|-----------|---------|------------|-----------------|----------|
| PostgreSQL 16 | 256 MB | 500 MB | 1 GB | 82 model, büyüyen veri |
| Redis 7 | 50 MB | 100 MB | 200 MB | Cache + session |
| Next.js Frontend | 300 MB | 500 MB | 1 GB | SSR, React 19 |
| .NET 9 Service | 100 MB | 200 MB | 500 MB | Excel/PDF işleme sırasında spike |
| Python AI Service | 200 MB | 500 MB | 1 GB | ML model yüklü, tahmin sırasında spike |
| Nginx | 20 MB | 50 MB | 50 MB | Sabit, hafif |
| **İşletim Sistemi** | **300 MB** | **500 MB** | **500 MB** | **Ubuntu overhead** |
| **TOPLAM** | **~1.2 GB** | **~2.4 GB** | **~4.2 GB** | |

### Container Bazında CPU Kullanımı

| Container | Boşta | Normal | Yoğun | Açıklama |
|-----------|-------|--------|-------|----------|
| PostgreSQL 16 | Düşük | Orta | Yüksek | Karmaşık sorgular, join'ler |
| Redis 7 | Düşük | Düşük | Düşük | Hafif operasyonlar |
| Next.js Frontend | Düşük | Orta | Orta | SSR render, API routes |
| .NET 9 Service | Düşük | Düşük | Yüksek | Excel import sırasında spike |
| Python AI Service | Düşük | Düşük | Yüksek | ML tahmin/anomali sırasında spike |
| Nginx | Düşük | Düşük | Düşük | Proxy, sabit |

### Disk Kullanımı Tahmini

| Bileşen | Boyut | Açıklama |
|---------|-------|----------|
| Docker image'lar | ~3-5 GB | 5 service image + base image'lar |
| PostgreSQL veri | ~500 MB - 5 GB | Büyümeye bağlı |
| Redis veri | ~50-200 MB | Cache, geçici |
| Uygulama kodu | ~500 MB | Kaynak + node_modules |
| Log dosyaları | ~1-5 GB | Zaman içinde birikir |
| İşletim sistemi | ~5-8 GB | Ubuntu + araçlar |
| Docker cache | ~2-5 GB | Build cache |
| Yedekler (lokal) | ~1-5 GB | Günlük DB yedekleri |
| **TOPLAM** | **~15-35 GB** | **Başlangıç + 6 aylık büyüme** |

### Bant Genişliği Tahmini

- Orta ölçekli bir kurumsal uygulama: **10-50 GB/ay** yeterli
- Natro'nun tüm XCloud paketleri **sınırsız trafik** sunuyor (100 Mbit)
- Bu projeniz için fazlasıyla yeterli

---

## 4. Paket Önerileri

### Senaryo 1: Bütçe Kısıtlı — XCloud Medium (~$31/ay)

```
+------------------------------------------+
| XCloud Medium                            |
| 2 Core / 4 GB RAM / 60 GB SSD           |
+------------------------------------------+
| + Temel işlevler çalışır                 |
| + En düşük maliyetli uygun seçenek      |
| - Swap zorunlu (4 GB swap ekleyin)       |
| - AI servisi yoğun kullanımda yavaşlar   |
| - Grafana/Prometheus eklenemez           |
| - Disk 60 GB, uzun vadede dar olabilir   |
+------------------------------------------+
```

**Kim için:** Geliştirme/test ortamı, düşük kullanıcı sayısı (1-5 kişi), bütçe öncelikli.

### Senaryo 2: En İyi Fiyat/Performans — XCloud Large (~$43/ay) ★ ÖNERİLEN

```
+------------------------------------------+
| XCloud Large                    ★ BEST   |
| 2 Core / 6 GB RAM / 100 GB SSD          |
+------------------------------------------+
| + 6 GB RAM tüm servislere yeterli       |
| + 100 GB disk rahat alan sağlar          |
| + Swap opsiyonel (2 GB önerilir)         |
| + Orta ölçekli kullanım sorunsuz         |
| - AI yoğun anlık işlemlerde hafif gecikme|
| - İzleme servisleri (Grafana) sınırlı    |
+------------------------------------------+
```

**Kim için:** Production ortamı, orta kullanıcı sayısı (5-20 kişi), fiyat/performans dengesi.

### Senaryo 3: Sorunsuz Deneyim — XCloud Pro (~$72/ay)

```
+------------------------------------------+
| XCloud Pro                               |
| 4 Core / 8 GB RAM / 200 GB SSD          |
+------------------------------------------+
| + Tüm servisler rahat çalışır            |
| + AI/ML işlemleri hızlı                  |
| + Grafana + Prometheus eklenebilir       |
| + 200 GB disk uzun vadede rahat          |
| + 4 Core ile paralel işlem kapasitesi    |
| + Büyüme için yer var                    |
| - Maliyet yüksek                         |
+------------------------------------------+
```

**Kim için:** Production ortamı, çok kullanıcılı (20+ kişi), performans öncelikli, izleme dahil.

### Karar Tablosu

| Kriter | Medium ($31) | Large ($43) | Pro ($72) |
|--------|:------------:|:-----------:|:---------:|
| Temel işlevler | Evet | Evet | Evet |
| Excel import/export | Evet | Evet | Evet |
| PDF rapor | Evet | Evet | Evet |
| AI tahmin/anomali | Yavaş | Normal | Hızlı |
| Eşzamanlı kullanıcı | 1-5 | 5-20 | 20+ |
| Grafana izleme | Hayır | Sınırlı | Evet |
| Disk rahatlığı | Dar | Rahat | Çok rahat |
| Swap gerekli mi? | Zorunlu (4GB) | Önerilir (2GB) | Opsiyonel |

### Özel Konfigürasyon Önerim

`/cloud-server-config` sayfasından özel konfigürasyon yapacaksanız:

| Bileşen | Önerim | Neden |
|---------|--------|-------|
| **CPU** | 2 vCPU | Çoğu zaman yeterli, spike'lar kısa süreli |
| **RAM** | 6 GB | 4 GB dar, 8 GB ideal ama 6 GB dengeli |
| **Disk** | 80 GB SSD | 60 GB dar, 100 GB rahat, 80 GB orta yol |
| **OS** | Ubuntu 24.04 LTS | En güncel LTS, Docker uyumlu |

---

## 5. Natro'dan Sipariş Verme

### Adım 5.1 - Natro Hesabı Açma

1. [natro.com](https://www.natro.com) adresine gidin
2. Hesabınız yoksa **"Kayıt Ol"** ile yeni hesap oluşturun
3. Hesabınıza giriş yapın

### Adım 5.2 - Cloud Server Sipariş Etme

**Hazır paket almak için:**
1. [natro.com/sunucu-kiralama/vps-cloud-server](https://www.natro.com/sunucu-kiralama/vps-cloud-server) adresine gidin
2. **XCloud Large** veya **XCloud Pro** paketini seçin
3. "Sepete Ekle" butonuna tıklayın

**Özel konfigürasyon yapmak için:**
1. [natro.com/sunucu-kiralama/cloud-server-config](https://www.natro.com/sunucu-kiralama/cloud-server-config) adresine gidin
2. CPU, RAM ve disk değerlerini önerilere göre ayarlayın
3. "Sepete Ekle" butonuna tıklayın

### Adım 5.3 - Sipariş Sırasında Dikkat Edilecekler

| Ayar | Seçilmesi Gereken | Neden |
|------|-------------------|-------|
| **İşletim Sistemi** | Ubuntu 22.04 LTS veya 24.04 LTS | Docker desteği, topluluk büyüklüğü |
| **Root Şifresi** | Güçlü, 16+ karakter | Sunucu güvenliği |
| **Plesk Panel** | GEREK YOK (almayın) | Docker ile yöneteceksiniz, gereksiz maliyet |
| **Windows Lisansı** | GEREK YOK (almayın) | Linux kullanılacak |
| **Yedekleme** | Dahil ise açın | Ek güvenlik katmanı |
| **DDoS Koruma** | Dahil (standart) | Zaten tüm paketlerde var |

> **Maliyet İpucu:** İndirim oranları ilk 3 ay için geçerlidir. Sonraki aylar
> normal fiyat uygulanır. Yıllık ödeme genellikle daha ekonomiktir.

### Adım 5.4 - Alan Adı (Zaten Varsa Atlayın)

Alan adınız yoksa Natro'dan alabilirsiniz:
1. **"Alan Adı"** > **"Alan Adı Sorgula"** bölümüne gidin
2. İstediğiniz alan adını arayın (örn: `ecosfer.com.tr`)
3. Uygun olanı sepete ekleyip satın alın

### Adım 5.5 - Sipariş Sonrası

Sipariş tamamlandıktan sonra Natro size e-posta ile gönderir:
- **Sunucu IP adresi** (örn: `185.XX.XX.XX`)
- **Root kullanıcı şifresi**
- **SSH bağlantı bilgileri**

Bu bilgileri güvenli bir yerde saklayın.

---

## 6. Subdomain Oluşturma ve DNS Ayarları

### Adım 6.1 - Natro Panel'den DNS Yönetimi

1. Natro müşteri paneline giriş yapın: [panel.natro.com](https://panel.natro.com)
2. **"Alan Adları"** > alan adınızı seçin > **"DNS Yönetimi"** bölümüne gidin

### Adım 6.2 - Subdomain için A Kaydı Ekleme

Aşağıdaki DNS kaydını ekleyin:

| Alan | Tür | Değer | TTL |
|------|-----|-------|-----|
| `cbam` | A | `VPS_IP_ADRESİNİZ` | 3600 |

> **Açıklama:** Bu kayıt `cbam.ecosfer.com` adresini VPS sunucunuzun IP'sine yönlendirir.
>
> `cbam` yerine istediğiniz subdomain adını kullanabilirsiniz (örn: `skdm`, `panel`, `app`).

**Örnek:**
```
Subdomain: cbam
Tür:       A
Değer:     185.XX.XX.XX  (Natro'dan aldığınız VPS IP adresi)
TTL:       3600
```

### Adım 6.3 - DNS Yayılmasını Bekleyin

- DNS değişiklikleri **5 dakika - 24 saat** arasında yayılır
- Kontrol etmek için:

```bash
# Windows PowerShell veya Terminal
nslookup cbam.ecosfer.com

# veya
ping cbam.ecosfer.com
```

IP adresiniz dönüyorsa DNS hazırdır.

---

## 7. VPS Sunucuya İlk Bağlantı

### Adım 7.1 - SSH ile Bağlanma

Natro'dan VPS kurulumu tamamlandığında size bir IP adresi ve root şifresi verilir.

```bash
# Terminal/PowerShell'den bağlanın
ssh root@VPS_IP_ADRESİNİZ
```

İlk bağlantıda "fingerprint" sorusu gelir, `yes` yazıp Enter'a basın.

### Adım 7.2 - Güvenlik: Yeni Kullanıcı Oluşturma

Root ile sürekli çalışmak güvenli değildir. Yeni bir kullanıcı oluşturun:

```bash
# Yeni kullanıcı oluştur
adduser ecosfer

# Sudo yetkisi ver
usermod -aG sudo ecosfer

# Yeni kullanıcıya geç
su - ecosfer
```

### Adım 7.3 - SSH Key Kurulumu (Önerilir)

Kendi bilgisayarınızda:

```bash
# SSH key oluşturun (yoksa)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Key'i sunucuya kopyalayın
ssh-copy-id ecosfer@VPS_IP_ADRESİNİZ
```

### Adım 7.4 - SSH Güvenlik Sıkılaştırma (Opsiyonel ama Önerilir)

```bash
sudo nano /etc/ssh/sshd_config
```

Aşağıdaki ayarları değiştirin:

```
# Root ile doğrudan girişi kapat
PermitRootLogin no

# Şifre ile girişi kapat (SSH key kullanıyorsanız)
PasswordAuthentication no

# Boşta kalma süresi
ClientAliveInterval 300
ClientAliveCountMax 2
```

```bash
# SSH servisini yeniden başlat
sudo systemctl restart sshd
```

> **Dikkat:** Bu ayarları yapmadan önce SSH key ile giriş yapabildiğinizden emin olun!
> Aksi halde sunucuya erişiminizi kaybedebilirsiniz.

---

## 8. Sunucu Hazırlığı

### Adım 8.1 - Sistem Güncellemesi

```bash
sudo apt update && sudo apt upgrade -y
```

### Adım 8.2 - Gerekli Araçları Yükleme

```bash
sudo apt install -y curl wget git nano ufw apt-transport-https ca-certificates gnupg lsb-release htop
```

### Adım 8.3 - Docker Kurulumu

```bash
# Docker GPG anahtarı ekle
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Docker repository ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker'ı yükle
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Kullanıcıyı docker grubuna ekle (sudo'suz kullanmak için)
sudo usermod -aG docker ecosfer

# Oturumu yenile (veya logout/login yapın)
newgrp docker

# Docker'ın çalıştığını doğrula
docker --version
docker compose version
```

Beklenen çıktı:
```
Docker version 27.x.x, build xxxxxxx
Docker Compose version v2.x.x
```

### Adım 8.4 - Güvenlik Duvarı (UFW) Ayarları

```bash
# SSH, HTTP ve HTTPS portlarını aç
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Güvenlik duvarını etkinleştir
sudo ufw enable

# Durumu kontrol et
sudo ufw status
```

Beklenen çıktı:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

> **Önemli:** Aşağıdaki portları dışarı **AÇMAYIN** — güvenlik riski:
> - PostgreSQL (5432) — sadece Docker ağı içinden erişilebilir olmalı
> - Redis (6379) — sadece Docker ağı içinden erişilebilir olmalı
> - .NET servisi (5100) — Nginx üzerinden proxy edilecek
> - AI servisi (8000) — Nginx üzerinden proxy edilecek

### Adım 8.5 - Swap Alanı Oluşturma

| RAM Miktarı | Önerilen Swap | Zorunlu mu? |
|-------------|---------------|-------------|
| 4 GB | 4 GB | Evet, zorunlu |
| 6 GB | 2 GB | Önerilir |
| 8 GB | 2 GB | Opsiyonel |

```bash
# Swap dosyası oluştur (RAM'inize göre boyutu ayarlayın)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Kalıcı yap (yeniden başlatmada da aktif kalması için)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Swappiness ayarı (düşük değer = RAM öncelikli kullanım)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Doğrula
free -h
```

Beklenen çıktı:
```
              total        used        free      shared  buff/cache   available
Mem:          4.0Gi       0.5Gi       2.5Gi       0.0Ki       1.0Gi       3.3Gi
Swap:         4.0Gi          0B       4.0Gi
```

### Adım 8.6 - Zaman Dilimi Ayarı

```bash
# Türkiye zaman dilimini ayarla
sudo timedatectl set-timezone Europe/Istanbul

# Doğrula
date
```

---

## 9. Proje Dosyalarını Sunucuya Yükleme

### Seçenek A: Git ile Çekme (Önerilen)

Projeniz bir Git repository'sinde ise:

```bash
# Proje dizini oluştur
mkdir -p ~/apps
cd ~/apps

# Repository'yi klonla (URL'yi kendi repo'nuzla değiştirin)
git clone https://github.com/KULLANICI/ecosfer-skdm-v2.git
cd ecosfer-skdm-v2
```

> **Avantajı:** Güncelleme yapmak `git pull` kadar kolay.

### Seçenek B: SCP ile Yükleme

Projeniz sadece lokal bilgisayarınızdaysa, **kendi bilgisayarınızdan** şu komutları çalıştırın:

```bash
# Windows PowerShell'de proje klasörünü sıkıştır:
Compress-Archive -Path "C:\Users\90544\Desktop\Ecosfer.SKDM.Panel\ecosfer-skdm-v2\*" -DestinationPath "ecosfer-skdm-v2.zip"

# SCP ile sunucuya yükle
scp ecosfer-skdm-v2.zip ecosfer@VPS_IP_ADRESİNİZ:~/apps/
```

**Sunucuda** sıkıştırılmış dosyayı açın:

```bash
cd ~/apps
sudo apt install -y unzip
unzip ecosfer-skdm-v2.zip -d ecosfer-skdm-v2
cd ecosfer-skdm-v2
```

### Seçenek C: SFTP Programı ile Yükleme (Grafik Arayüz)

**FileZilla** veya **WinSCP** kullanarak dosyaları görsel olarak sunucuya yükleyebilirsiniz.

Bağlantı bilgileri:
| Alan | Değer |
|------|-------|
| Host | `VPS_IP_ADRESİNİZ` |
| Port | `22` |
| Protokol | SFTP |
| Kullanıcı | `ecosfer` |
| Kimlik Doğrulama | Şifre veya SSH Key |
| Hedef Dizin | `/home/ecosfer/apps/ecosfer-skdm-v2` |

### Yükleme Sonrası Kontrol

```bash
cd ~/apps/ecosfer-skdm-v2

# Dosya yapısını kontrol et
ls -la
# Beklenen: docker-compose.yml, docker-compose.prod.yml, frontend/, services/, docker/, ...

ls -la frontend/
# Beklenen: package.json, next.config.ts, prisma/, src/, ...

ls -la services/
# Beklenen: dotnet/, ai/
```

---

## 10. Ortam Değişkenlerini Yapılandırma

### Adım 10.1 - Güçlü Şifreler Oluşturma

Önce ihtiyacınız olan şifreleri oluşturun:

```bash
# Veritabanı şifresi (32 karakter)
echo "DB_PASSWORD: $(openssl rand -base64 32)"

# Redis şifresi (24 karakter)
echo "REDIS_PASSWORD: $(openssl rand -base64 24)"

# NextAuth secret (64 karakter)
echo "NEXTAUTH_SECRET: $(openssl rand -base64 64)"

# Grafana şifresi (24 karakter)
echo "GRAFANA_PASSWORD: $(openssl rand -base64 24)"
```

> Bu çıktıları not edin. Bir sonraki adımda `.env` dosyasına yapıştıracaksınız.

### Adım 10.2 - Production .env Dosyası Oluşturma

```bash
cd ~/apps/ecosfer-skdm-v2
nano .env
```

Aşağıdaki içeriği **kendi değerlerinizle** doldurun:

```env
# ============================================
# VERİTABANI
# ============================================
DB_USER=ecosfer
DB_PASSWORD=<YUKARIDA_OLUSTURDUGUZ_DB_SIFRESI>
DB_NAME=ecosfer_skdm
DATABASE_URL=postgresql://ecosfer:<AYNI_DB_SIFRESI>@db:5432/ecosfer_skdm?schema=public

# ============================================
# REDIS
# ============================================
REDIS_PASSWORD=<YUKARIDA_OLUSTURDUGUZ_REDIS_SIFRESI>
REDIS_URL=redis://:<AYNI_REDIS_SIFRESI>@redis:6379

# ============================================
# NEXTAUTH
# ============================================
NEXTAUTH_URL=https://cbam.ecosfer.com
NEXTAUTH_SECRET=<YUKARIDA_OLUSTURDUGUZ_NEXTAUTH_SECRET>

# ============================================
# SERVİSLER (Docker network içi - DEĞİŞTİRMEYİN)
# ============================================
DOTNET_SERVICE_URL=http://dotnet:5100
AI_SERVICE_URL=http://ai:8000

# ============================================
# CORS
# ============================================
CORS_ALLOWED_ORIGINS=https://cbam.ecosfer.com

# ============================================
# E-POSTA (Opsiyonel - Resend.com'dan API key alın)
# ============================================
# RESEND_API_KEY=re_xxxxxxxxxxxx

# ============================================
# YAPAY ZEKA SERVİSLERİ (Opsiyonel)
# ============================================
# AI servislerini kullanmak için en az birini açın:
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
# OPENAI_API_KEY=sk-xxxxxxxxxxxx

# ============================================
# CONTAINER REGISTRY (Docker Hub/GHCR kullanıyorsanız)
# ============================================
REGISTRY=ghcr.io
IMAGE_PREFIX=ecosfer/skdm
TAG=latest

# ============================================
# GRAFANA İZLEME PANELİ (Opsiyonel)
# ============================================
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<YUKARIDA_OLUSTURDUGUZ_GRAFANA_SIFRESI>
```

### Adım 10.3 - .env Dosyasını Koruma

```bash
# Dosya izinlerini kısıtla (sadece sahibi okuyabilsin)
chmod 600 .env

# .gitignore'da olduğunu doğrula
grep ".env" .gitignore
```

> **Güvenlik Uyarısı:** `.env` dosyası hassas şifreler içerir.
> - Asla Git'e commit etmeyin
> - Asla başkalarıyla paylaşmayın
> - Yedekleme yaparken ayrıca şifreli saklayın

---

## 11. Docker ile Uygulamayı Başlatma

### Adım 11.1 - Docker Image'larını Oluşturma

```bash
cd ~/apps/ecosfer-skdm-v2

# Production compose dosyasıyla image'ları oluştur
docker compose -f docker-compose.prod.yml build
```

> **Not:** Bu işlem ilk seferde **10-20 dakika** sürebilir.
> Node.js, .NET ve Python base image'ları indirilir, bağımlılıklar yüklenir ve projeler derlenir.

### Adım 11.2 - Container'ları Başlatma

```bash
# Tüm servisleri arka planda başlat
docker compose -f docker-compose.prod.yml up -d
```

### Adım 11.3 - Container Durumunu Kontrol Etme

```bash
# Tüm container'ların durumunu gör
docker compose -f docker-compose.prod.yml ps
```

Beklenen çıktı — tüm servisler **Up (healthy)** durumunda olmalı:

```
NAME        STATUS              PORTS
db          Up (healthy)        5432/tcp
redis       Up (healthy)        6379/tcp
frontend    Up (healthy)        0.0.0.0:3000->3000/tcp
dotnet      Up (healthy)        0.0.0.0:5100->5100/tcp
ai          Up (healthy)        0.0.0.0:8000->8000/tcp
nginx       Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Adım 11.4 - Logları İzleme

```bash
# Tüm servislerin loglarını izle
docker compose -f docker-compose.prod.yml logs -f

# Sadece belirli bir servisin loglarını gör
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f db
docker compose -f docker-compose.prod.yml logs -f dotnet
docker compose -f docker-compose.prod.yml logs -f ai

# Son 100 satır log
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Adım 11.5 - Kaynak Kullanımını İzleme

```bash
# Anlık CPU/RAM kullanımı
docker stats --no-stream

# Sürekli izleme
docker stats
```

---

## 12. Nginx Reverse Proxy ve SSL Ayarları

### Adım 12.1 - Nginx Yapılandırmasını Güncelleme

Proje ile birlikte gelen Nginx konfigürasyonunda subdomain adresinizi güncelleyin:

```bash
nano docker/nginx/nginx.conf
```

`server_name` satırını kendi subdomain'inizle değiştirin:

```nginx
server_name cbam.ecosfer.com;
```

### Adım 12.2 - SSL Sertifikası Alma (Let's Encrypt - Ücretsiz)

```bash
# Certbot yükle
sudo apt install -y certbot

# Nginx container'ını geçici olarak durdur (80 portu serbest kalması için)
docker compose -f docker-compose.prod.yml stop nginx

# SSL sertifikası al
sudo certbot certonly --standalone -d cbam.ecosfer.com
```

Certbot size bazı sorular soracak:
- E-posta adresi girin (sertifika yenileme bildirimleri için)
- Kullanım şartlarını kabul edin (A)
- E-posta paylaşımını reddedin veya kabul edin (N/Y)

Başarılı olursa:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/cbam.ecosfer.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/cbam.ecosfer.com/privkey.pem
```

### Adım 12.3 - Nginx'i SSL ile Yapılandırma

`docker/nginx/nginx.conf` dosyasının server bloğunu SSL destekli hale getirin:

```nginx
# HTTP -> HTTPS yönlendirme
server {
    listen 80;
    server_name cbam.ecosfer.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS sunucu
server {
    listen 443 ssl http2;
    server_name cbam.ecosfer.com;

    # SSL Sertifikaları
    ssl_certificate     /etc/letsencrypt/live/cbam.ecosfer.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cbam.ecosfer.com/privkey.pem;

    # SSL Güvenlik Ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS (Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ... geri kalan proxy ayarları (location blokları) aynı kalır
}
```

### Adım 12.4 - SSL Sertifikalarını Docker'a Mount Etme

`docker-compose.prod.yml` dosyasında nginx servisine sertifika volume'u ekleyin:

```yaml
nginx:
  # ... mevcut ayarlar
  volumes:
    - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro    # <- Bu satırı ekleyin
  ports:
    - "80:80"
    - "443:443"
```

### Adım 12.5 - Nginx'i Yeniden Başlatma

```bash
cd ~/apps/ecosfer-skdm-v2
docker compose -f docker-compose.prod.yml up -d nginx
```

### Adım 12.6 - SSL Otomatik Yenileme

Let's Encrypt sertifikaları **90 günde** sona erer. Otomatik yenileme için cron job ekleyin:

```bash
sudo crontab -e
```

Aşağıdaki satırı ekleyin:

```cron
# Her gün 03:00'te SSL sertifikasını kontrol et ve gerekirse yenile
0 3 * * * certbot renew --quiet --pre-hook "docker compose -f /home/ecosfer/apps/ecosfer-skdm-v2/docker-compose.prod.yml stop nginx" --post-hook "docker compose -f /home/ecosfer/apps/ecosfer-skdm-v2/docker-compose.prod.yml start nginx"
```

### Adım 12.7 - SSL Doğrulama

```bash
# Sertifika bilgilerini kontrol et
sudo certbot certificates

# HTTPS bağlantısını test et
curl -I https://cbam.ecosfer.com

# HTTP -> HTTPS yönlendirmesini test et
curl -I http://cbam.ecosfer.com
# Beklenen: 301 Moved Permanently, Location: https://cbam.ecosfer.com/
```

---

## 13. Veritabanı Kurulumu ve Seed

### Adım 13.1 - Veritabanı Migration'larını Çalıştırma

```bash
cd ~/apps/ecosfer-skdm-v2

# Frontend container'ına bağlan
docker compose -f docker-compose.prod.yml exec frontend sh

# Container içinde migration'ları uygula
npx prisma migrate deploy

# Çık
exit
```

Beklenen çıktı:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "ecosfer_skdm"

X migrations found in prisma/migrations
...
All migrations have been successfully applied.
```

### Adım 13.2 - Başlangıç Verilerini Yükleme (Seed)

```bash
# Frontend container'ına bağlan
docker compose -f docker-compose.prod.yml exec frontend sh

# Seed verilerini yükle
npx prisma db seed

# Çık
exit
```

> **Seed ile yüklenen veriler:**
> - Ülkeler ve şehirler
> - CN kodları (gümrük tarife numaraları)
> - CBAM referans verileri (6 sektör)
> - Birim tanımları
> - Varsayılan roller
> - İlk admin kullanıcı

### Adım 13.3 - Veritabanı Bağlantısını Doğrulama

```bash
# PostgreSQL'e doğrudan bağlan
docker compose -f docker-compose.prod.yml exec db psql -U ecosfer -d ecosfer_skdm

# Tablo sayısını kontrol et (82 civarı olmalı)
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

# Seed verilerini kontrol et
SELECT count(*) FROM "Country";
SELECT count(*) FROM "User";

# Çık
\q
```

### Adım 13.4 - İlk Giriş

```
URL:     https://cbam.ecosfer.com
E-posta: (seed dosyasındaki admin e-posta)
Şifre:   (seed dosyasındaki admin şifre)
```

> **Önemli:** İlk girişten sonra admin şifresini mutlaka değiştirin!

---

## 14. Doğrulama ve Test

### Adım 14.1 - Servis Sağlık Kontrolleri

```bash
# Frontend
curl -s https://cbam.ecosfer.com/api/health
# Beklenen: {"status":"ok"} veya benzeri

# .NET Document Service (sunucu içinden)
curl -s http://localhost:5100/health
# Beklenen: {"status":"healthy"}

# Python AI Service (sunucu içinden)
curl -s http://localhost:8000/health
# Beklenen: {"status":"healthy"}

# PostgreSQL
docker compose -f docker-compose.prod.yml exec db pg_isready -U ecosfer
# Beklenen: accepting connections

# Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
# Beklenen: PONG
```

### Adım 14.2 - Tarayıcıdan Test

1. `https://cbam.ecosfer.com` adresine gidin
2. SSL sertifikasının geçerli olduğunu doğrulayın (adres çubuğunda kilit ikonu)
3. Giriş sayfasının yüklendiğini kontrol edin
4. Admin hesabıyla giriş yapın
5. Dashboard'un düzgün geldiğini kontrol edin
6. Temel işlevleri test edin:
   - Tesis ekleme
   - Emisyon verisi girişi
   - Excel import/export
   - PDF rapor oluşturma
   - XML beyanname üretimi

### Adım 14.3 - Tam Kontrol Listesi

**Altyapı:**
- [ ] SSH ile sunucuya bağlanılabiliyor
- [ ] Docker çalışıyor (`docker ps`)
- [ ] Tüm container'lar "healthy" durumda
- [ ] UFW güvenlik duvarı aktif

**DNS ve SSL:**
- [ ] DNS çözümleniyor (`nslookup cbam.ecosfer.com` IP dönüyor)
- [ ] SSL sertifikası geçerli (tarayıcıda kilit ikonu)
- [ ] HTTP -> HTTPS yönlendirmesi çalışıyor
- [ ] SSL otomatik yenileme cron job'u tanımlı

**Uygulama:**
- [ ] Giriş sayfası yükleniyor
- [ ] Admin ile giriş yapılabiliyor
- [ ] Dashboard veriler gösteriyor
- [ ] Dil değişimi çalışıyor (TR/EN/DE)
- [ ] Tema değişimi çalışıyor (Açık/Koyu)

**Veritabanı:**
- [ ] PostgreSQL bağlantısı çalışıyor
- [ ] Migration'lar uygulanmış
- [ ] Seed verileri yüklenmiş (ülkeler, CN kodları)

**Servisler:**
- [ ] Redis cache çalışıyor (`PONG` yanıtı)
- [ ] .NET servisi yanıt veriyor (`/health`)
- [ ] Python AI servisi yanıt veriyor (`/health`)

**İşlevsellik:**
- [ ] Tesis ekleme/düzenleme
- [ ] Emisyon verisi girişi
- [ ] Excel import çalışıyor (5 sayfa)
- [ ] Excel export çalışıyor
- [ ] PDF rapor oluşturuluyor
- [ ] XML beyanname üretilebiliyor

**Yedekleme:**
- [ ] Günlük yedekleme cron job'u tanımlı
- [ ] Manuel yedek alınabiliyor
- [ ] Yedekten geri yükleme test edildi

---

## 15. Bakım ve İzleme

### Günlük Bakım Komutları

```bash
cd ~/apps/ecosfer-skdm-v2

# Tüm servislerin durumunu gör
docker compose -f docker-compose.prod.yml ps

# Kaynak kullanımını gör
docker stats --no-stream

# Logları izle (son 100 satır)
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Belirli bir servisin loglarını gör
docker compose -f docker-compose.prod.yml logs -f frontend --tail=50

# Disk kullanımını kontrol et
df -h
docker system df

# Sunucu uptime ve yük
uptime
free -h
```

### Güncelleme Prosedürü

```bash
cd ~/apps/ecosfer-skdm-v2

# 1. Mevcut durumu kontrol et
docker compose -f docker-compose.prod.yml ps

# 2. Yedek al (güncelleme öncesi)
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U ecosfer ecosfer_skdm > ~/backups/pre-update_$(date +%Y%m%d_%H%M%S).sql

# 3. Yeni kodu çek
git pull origin master

# 4. Image'ları yeniden oluştur
docker compose -f docker-compose.prod.yml build

# 5. Servisleri yeniden başlat
docker compose -f docker-compose.prod.yml up -d

# 6. Veritabanı migration'ları varsa çalıştır
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate deploy

# 7. Sağlık kontrolü
docker compose -f docker-compose.prod.yml ps
curl -s https://cbam.ecosfer.com/api/health
```

### Yedekleme Sistemi

#### Manuel Yedekleme

```bash
# PostgreSQL tam yedeği
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U ecosfer ecosfer_skdm > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Yedek boyutunu kontrol et
ls -lh ~/backups/

# Yedek dosyasını kendi bilgisayarınıza indirin
# (kendi bilgisayarınızda çalıştırın)
scp ecosfer@VPS_IP:~/backups/backup_*.sql ./
```

#### Otomatik Günlük Yedekleme

```bash
# Yedek dizini oluştur
mkdir -p ~/backups

# Crontab'a ekle
sudo crontab -e
```

Aşağıdaki satırı ekleyin:

```cron
# Her gece 02:00'de PostgreSQL yedeği al, 30 günden eski yedekleri sil
0 2 * * * cd /home/ecosfer/apps/ecosfer-skdm-v2 && docker compose -f docker-compose.prod.yml exec -T db pg_dump -U ecosfer ecosfer_skdm > /home/ecosfer/backups/backup_$(date +\%Y\%m\%d).sql && find /home/ecosfer/backups/ -name "backup_*.sql" -mtime +30 -delete
```

#### Yedekten Geri Yükleme

```bash
# DİKKAT: Bu işlem mevcut veritabanını SİLER ve yedeği yükler
docker compose -f docker-compose.prod.yml exec -T db psql -U ecosfer -d ecosfer_skdm < ~/backups/backup_20260224.sql
```

### Grafana İzleme Paneli (XCloud Pro+ paketlerde)

Production compose dosyanızda Grafana etkinse:

```
URL:       https://cbam.ecosfer.com/grafana
Kullanıcı: admin
Şifre:     (.env dosyasındaki GRAFANA_ADMIN_PASSWORD)
```

3 hazır dashboard:
1. **System Overview** — Genel sağlık, istek oranları, hata oranları
2. **Service Health** — Servis bazlı metrikler, gecikme yüzdelikleri
3. **Logs** — Loki entegrasyonlu log görüntüleyici

### Docker Temizliği (Aylık)

```bash
# Kullanılmayan image'ları temizle
docker image prune -af

# Kullanılmayan volume'ları temizle (DİKKAT: veri kaybı riski)
# docker volume prune -f  # Sadece emin olduğunuzda!

# Genel temizlik (çalışmayan container, kullanılmayan ağ, dangling image)
docker system prune -f

# Disk kazancını gör
docker system df
```

---

## 16. Sorun Giderme

### Container Başlamıyor

```bash
# Tüm container durumlarını gör
docker compose -f docker-compose.prod.yml ps -a

# Başarısız container'ın loglarını kontrol et
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs db
docker compose -f docker-compose.prod.yml logs dotnet
docker compose -f docker-compose.prod.yml logs ai

# Container'ı sıfırdan yeniden oluştur
docker compose -f docker-compose.prod.yml up -d --force-recreate frontend
```

### Veritabanına Bağlanamıyor

```bash
# PostgreSQL container'ının çalıştığını kontrol et
docker compose -f docker-compose.prod.yml ps db

# Container içinden bağlantı test et
docker compose -f docker-compose.prod.yml exec db psql -U ecosfer -d ecosfer_skdm -c "SELECT 1;"

# .env dosyasındaki DATABASE_URL'yi kontrol et
grep DATABASE_URL .env

# Veritabanı loglarını kontrol et
docker compose -f docker-compose.prod.yml logs db --tail=50
```

### 502 Bad Gateway Hatası

```bash
# Nginx loglarını kontrol et
docker compose -f docker-compose.prod.yml logs nginx --tail=50

# Frontend'in çalıştığını kontrol et
docker compose -f docker-compose.prod.yml ps frontend

# Frontend sağlık kontrolü (container içinden)
docker compose -f docker-compose.prod.yml exec frontend wget -qO- http://localhost:3000/api/health

# Nginx'i yeniden başlat
docker compose -f docker-compose.prod.yml restart nginx
```

### SSL Sertifikası Sorunu

```bash
# Sertifika durumunu kontrol et
sudo certbot certificates

# Manuel yenileme
sudo certbot renew --force-renewal

# Sertifika dosyalarının varlığını kontrol et
sudo ls -la /etc/letsencrypt/live/cbam.ecosfer.com/
```

### Disk Alanı Doldu

```bash
# Genel disk durumu
df -h

# Docker disk kullanımı
docker system df

# En büyük dosya/dizinleri bul
sudo du -sh /var/lib/docker/*
sudo du -sh ~/apps/ecosfer-skdm-v2/*
sudo du -sh ~/backups/*

# Docker temizliği
docker system prune -af

# Eski yedekleri temizle
find ~/backups/ -name "backup_*.sql" -mtime +7 -delete

# Eski Docker loglarını temizle
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### RAM Yetersiz / OOM Killer

```bash
# Mevcut bellek durumu
free -h

# Hangi container ne kadar RAM kullanıyor
docker stats --no-stream

# Swap durumunu kontrol et
swapon --show

# Swap yoksa veya yetersizse ekle
sudo fallocate -l 4G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2

# AI servisini yeniden başlat (genelde en çok RAM kullanan)
docker compose -f docker-compose.prod.yml restart ai
```

### Servis Yanıt Vermiyor

```bash
# Tüm servislerin sağlık durumu
curl -s http://localhost:3000/api/health  # Frontend
curl -s http://localhost:5100/health      # .NET
curl -s http://localhost:8000/health      # Python AI

# Belirli bir servisi yeniden başlat
docker compose -f docker-compose.prod.yml restart frontend
docker compose -f docker-compose.prod.yml restart dotnet
docker compose -f docker-compose.prod.yml restart ai

# Tüm servisleri yeniden başlat
docker compose -f docker-compose.prod.yml restart

# Nuclear option: Tümünü durdur ve yeniden başlat
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### DNS Çözümlenmiyor

```bash
# DNS kontrolü (sunucudan)
nslookup cbam.ecosfer.com
dig cbam.ecosfer.com

# DNS kontrolü (kendi bilgisayarınızdan)
nslookup cbam.ecosfer.com

# Natro panelinden A kaydını kontrol edin
# A kaydı doğru IP'ye mi yönleniyor?
# TTL süresi geçmiş mi?
```

---

## 17. Hızlı Referans

### Tüm Cron Job'lar (Özet)

```cron
# SSL sertifikası otomatik yenileme (her gün 03:00)
0 3 * * * certbot renew --quiet --pre-hook "docker compose -f /home/ecosfer/apps/ecosfer-skdm-v2/docker-compose.prod.yml stop nginx" --post-hook "docker compose -f /home/ecosfer/apps/ecosfer-skdm-v2/docker-compose.prod.yml start nginx"

# PostgreSQL günlük yedekleme (her gün 02:00)
0 2 * * * cd /home/ecosfer/apps/ecosfer-skdm-v2 && docker compose -f docker-compose.prod.yml exec -T db pg_dump -U ecosfer ecosfer_skdm > /home/ecosfer/backups/backup_$(date +\%Y\%m\%d).sql && find /home/ecosfer/backups/ -name "backup_*.sql" -mtime +30 -delete
```

### Günlük Kullanım Komutları

```bash
# Sunucuya bağlan
ssh ecosfer@VPS_IP_ADRESİNİZ

# Proje dizinine git
cd ~/apps/ecosfer-skdm-v2

# Durum kontrol
docker compose -f docker-compose.prod.yml ps
docker stats --no-stream
free -h
df -h

# Log izleme
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Yeniden başlatma
docker compose -f docker-compose.prod.yml restart
```

### Deploy Komutları (Güncelleme)

```bash
ssh ecosfer@VPS_IP_ADRESİNİZ
cd ~/apps/ecosfer-skdm-v2

# Yedek al
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U ecosfer ecosfer_skdm > ~/backups/pre-update_$(date +%Y%m%d).sql

# Güncelle
git pull origin master
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate deploy

# Doğrula
docker compose -f docker-compose.prod.yml ps
curl -s https://cbam.ecosfer.com/api/health
```

### Port ve Servis Haritası

```
Internet Kullanıcısı
        |
        v
  [cbam.ecosfer.com]
        |
        v
+------------------+
|      Nginx       |  :80  (HTTP -> HTTPS redirect)
|   Reverse Proxy  |  :443 (HTTPS + SSL)
+--------+---------+
         |
  +------+----------------------------------+
  |      |        Docker Network            |
  |      v                                  |
  |  +----------+                           |
  |  | Next.js  | :3000                     |
  |  | Frontend |                           |
  |  | (React19)|                           |
  |  +----+-----+                           |
  |       |                                 |
  |  +----+--------+---------+              |
  |  |    |        |         |              |
  |  v    v        v         v              |
  | +----+ +-----+ +------+ +------+       |
  | | PG | |Redis| | .NET | |Python|       |
  | | 16 | |  7  | |  9   | | Fast |       |
  | |    | |     | | Docs | |  API |       |
  | |5432| |6379 | | 5100 | | 8000 |       |
  | +----+ +-----+ +------+ +------+       |
  |                                         |
  +-----------------------------------------+

Dış Erişim:
  - :80  -> Nginx (HTTP, HTTPS'e yönlendirir)
  - :443 -> Nginx (HTTPS, SSL terminasyonu)

İç Erişim (Sadece Docker Network):
  - :3000 -> Next.js Frontend
  - :5100 -> .NET Document Service
  - :8000 -> Python AI Service
  - :5432 -> PostgreSQL (veritabanı)
  - :6379 -> Redis (cache)
```

### Önemli Dosya Konumları

| Dosya/Dizin | Konum | Açıklama |
|-------------|-------|----------|
| Proje kodu | `~/apps/ecosfer-skdm-v2/` | Ana proje dizini |
| .env dosyası | `~/apps/ecosfer-skdm-v2/.env` | Ortam değişkenleri |
| Docker Compose | `~/apps/ecosfer-skdm-v2/docker-compose.prod.yml` | Production yapılandırma |
| Nginx config | `~/apps/ecosfer-skdm-v2/docker/nginx/nginx.conf` | Reverse proxy ayarları |
| Prisma schema | `~/apps/ecosfer-skdm-v2/frontend/prisma/schema.prisma` | Veritabanı şeması |
| SSL sertifika | `/etc/letsencrypt/live/cbam.ecosfer.com/` | Let's Encrypt sertifikaları |
| Yedekler | `~/backups/` | Günlük DB yedekleri |
| Docker veri | `/var/lib/docker/` | Docker volume'lar ve image'lar |

---

> **Destek:**
> - Sunucu sorunları: Natro destek hattı
> - Uygulama sorunları: Proje dokümantasyonu (`/docs/` dizini)
> - Mimari detaylar: `docs/ARCHITECTURE.md`
> - API referansı: `docs/API.md`
> - Kullanıcı kılavuzu: `docs/USER_GUIDE.md`
