# Ecosfer SKDM v2.0 - Yeni Bilgisayara Kurulum Rehberi

> Ecosfer SKDM v2.0 projesini sıfırdan başka bir bilgisayara kurmak için adım adım rehber.
> İki farklı kurulum yöntemi sunulmaktadır.

---

## İçindekiler

1. [Hangi Yöntemi Seçmeliyim?](#1-hangi-yöntemi-seçmeliyim)
2. [Yöntem A: Basit Kurulum (Sadece Frontend + PostgreSQL)](#2-yöntem-a-basit-kurulum)
3. [Yöntem B: Tam Kurulum (Docker ile Tüm Servisler)](#3-yöntem-b-tam-kurulum-docker)
4. [Proje Dosyalarını Aktarma](#4-proje-dosyalarını-aktarma)
5. [Giriş Bilgileri ve Test](#5-giriş-bilgileri-ve-test)
6. [Sorun Giderme](#6-sorun-giderme)

---

## 1. Hangi Yöntemi Seçmeliyim?

| | Yöntem A: Basit Kurulum | Yöntem B: Docker Kurulum |
|---|---|---|
| **Kim için** | Test, demo, frontend geliştirme | Tam geliştirme, tüm özellikler |
| **Kurulacaklar** | Node.js + PostgreSQL | Docker Desktop |
| **Zorluk** | Kolay | Orta |
| **Süre** | ~15 dakika | ~30 dakika |
| **Dashboard** | Çalışır | Çalışır |
| **CRUD işlemleri** | Çalışır | Çalışır |
| **Beyanname sihirbazı** | Çalışır | Çalışır |
| **Dil değiştirme (TR/EN/DE)** | Çalışır | Çalışır |
| **Excel import/export** | Çalışmaz | Çalışır |
| **PDF rapor** | Çalışmaz | Çalışır |
| **XML beyanname** | Çalışmaz | Çalışır |
| **AI tahmin/anomali** | Çalışmaz | Çalışır (API key gerekli) |
| **İşletim sistemi** | Windows / macOS / Linux | Windows / macOS / Linux |

> **Öneri:** Sadece test ve demo için **Yöntem A**, tam geliştirme için **Yöntem B** kullanın.

---

## 2. Yöntem A: Basit Kurulum

> Sadece Node.js ve PostgreSQL kurulur. Excel/PDF/AI servisleri devre dışıdır.

### Ön Gereksinimler

| Yazılım | Minimum Sürüm | İndirme Adresi |
|---------|---------------|----------------|
| **Node.js** | v22 veya üzeri (LTS) | https://nodejs.org/en/download |
| **PostgreSQL** | 16 | https://www.postgresql.org/download |
| **Git** | herhangi bir sürüm | https://git-scm.com/downloads |

### Adım A.1 - Node.js Kurulumu

#### Windows:
1. https://nodejs.org adresinden **LTS** sürümünü indirin
2. Kurulum sihirbazını çalıştırın (tüm varsayılanları kabul edin)
3. Doğrulama:
```powershell
node --version
# Beklenen: v22.x.x veya üzeri

npm --version
# Beklenen: 10.x.x veya üzeri
```

#### macOS:
```bash
# Homebrew ile
brew install node@22

# Doğrula
node --version
npm --version
```

#### Linux (Ubuntu/Debian):
```bash
# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Doğrula
node --version
npm --version
```

### Adım A.2 - PostgreSQL 16 Kurulumu

#### Windows:
1. https://www.postgresql.org/download/windows/ adresinden PostgreSQL 16 indirin
2. Kurulum sihirbazını çalıştırın:
   - **Şifre:** `postgres123` belirleyin (veya istediğiniz bir şifre)
   - **Port:** `5432` (varsayılan, değiştirmeyin)
   - **Locale:** varsayılan bırakın
   - **Stack Builder:** atlayın (gerek yok)
3. Kurulum tamamlandıktan sonra veritabanı oluşturun:

**Yöntem 1 — pgAdmin ile (görsel):**
- Başlat menüsünden pgAdmin 4'ü açın
- Sol panelden Servers > PostgreSQL 16 > sağ tık > Create > Database
- Database name: `ecosfer_skdm` > Save

**Yöntem 2 — Terminal ile:**
```powershell
# PostgreSQL bin dizinini PATH'e ekleyin veya tam yol kullanın
# Varsayılan kurulum yolu:
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE ecosfer_skdm;"
# Şifre sorulduğunda kurulumda belirlediğiniz şifreyi girin
```

#### macOS:
```bash
brew install postgresql@16
brew services start postgresql@16
createdb ecosfer_skdm
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt install -y postgresql-16
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres createdb ecosfer_skdm
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres123';"
```

### Adım A.3 - Proje Dosyalarını Alma

```bash
# Git ile (repo erişiminiz varsa)
git clone https://github.com/Ecosfer-destek/ecosfer_CBAM.git
cd ecosfer_CBAM

# veya zip dosyasını açtıktan sonra
cd ecosfer-skdm-v2
```

### Adım A.4 - Frontend .env Dosyası Oluşturma

`frontend/` dizininde `.env` dosyası oluşturun:

#### Windows (PowerShell):
```powershell
cd frontend

# .env dosyası oluştur
@"
# Database (localhost PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ecosfer_skdm?schema=public"

# Redis - frontend kullanmiyor, bos birakilabilir
REDIS_URL=""

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ecosfer-skdm-dev-secret-change-in-production-2026"
AUTH_SECRET="ecosfer-skdm-dev-secret-change-in-production-2026"

# .NET ve AI - test ortaminda devre disi
DOTNET_SERVICE_URL=""
AI_SERVICE_URL=""
"@ | Out-File -FilePath .env -Encoding utf8
```

#### macOS / Linux:
```bash
cd frontend

cat > .env << 'EOF'
# Database (localhost PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ecosfer_skdm?schema=public"

# Redis - frontend kullanmiyor, bos birakilabilir
REDIS_URL=""

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ecosfer-skdm-dev-secret-change-in-production-2026"
AUTH_SECRET="ecosfer-skdm-dev-secret-change-in-production-2026"

# .NET ve AI - test ortaminda devre disi
DOTNET_SERVICE_URL=""
AI_SERVICE_URL=""
EOF
```

> **Not:** `postgres123` yerine PostgreSQL kurulumunda belirlediğiniz şifreyi yazın.

### Adım A.5 - Bağımlılıkları Yükleme

```bash
cd frontend
npm install
```

> Bu işlem **2-5 dakika** sürebilir (ilk kurulum, tüm paketler indirilir).

### Adım A.6 - Prisma Client ve Veritabanı Tablolarını Oluşturma

```bash
# Prisma client oluştur
npx prisma generate

# Veritabanı tablolarını oluştur (82 tablo)
npx prisma db push
```

Beklenen çıktı:
```
Your database is now in sync with your Prisma schema.
```

### Adım A.7 - Başlangıç Verilerini Yükleme (Seed)

```bash
npm run db:seed
```

Bu komut 12 adımda şunları yükler:
- 3 tenant (Ecosfer, Roder, Borubar)
- Admin kullanıcılar
- 39+ ülke, 30+ şehir, 26+ ilçe
- 60+ CN kodu, birimler, roller
- Örnek şirket ve tesis verileri
- CBAM referans verileri

Beklenen son satır:
```
Seeding completed successfully!
```

### Adım A.8 - Uygulamayı Başlatma

```bash
npm run dev
```

Beklenen çıktı:
```
  ▲ Next.js 16.1.6
  - Local:   http://localhost:3000
  - Network: http://192.168.x.x:3000
```

Tarayıcıda **http://localhost:3000** adresini açın.

### Adım A.9 - Giriş Yapma

```
E-posta: info@ecosfer.com
Şifre:   Ankara3406.
```

---

## 3. Yöntem B: Tam Kurulum (Docker)

> Docker ile tüm servisler (PostgreSQL, Redis, .NET, Python AI) birlikte çalışır.
> Excel import/export, PDF rapor ve AI özellikleri dahil.

### Ön Gereksinimler

| Yazılım | Minimum Sürüm | İndirme Adresi |
|---------|---------------|----------------|
| **Docker Desktop** | 4.x | https://www.docker.com/products/docker-desktop |
| **Git** | herhangi bir sürüm | https://git-scm.com/downloads |

> **Not:** Docker Desktop, Windows'ta **WSL 2** gerektirir. Kurulum sırasında otomatik yüklenir.

### Adım B.1 - Docker Desktop Kurulumu

#### Windows:
1. https://www.docker.com/products/docker-desktop adresinden indirin
2. Kurulum sihirbazını çalıştırın
3. WSL 2 etkinleştirme isterse kabul edin
4. Bilgisayarı yeniden başlatın
5. Docker Desktop'u açın ve çalıştığını doğrulayın:

```powershell
docker --version
# Beklenen: Docker version 27.x.x

docker compose version
# Beklenen: Docker Compose version v2.x.x
```

#### macOS:
1. https://www.docker.com/products/docker-desktop adresinden indirin
2. `.dmg` dosyasını açıp Docker'ı Applications'a sürükleyin
3. Docker Desktop'u açın

```bash
docker --version
docker compose version
```

#### Linux (Ubuntu):
```bash
# Docker Engine kur
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Oturumu yenile
newgrp docker

# Doğrula
docker --version
docker compose version
```

### Adım B.2 - Docker Desktop Ayarları (Windows/macOS)

Docker Desktop > Settings (Ayarlar):

| Ayar | Önerilen Değer | Neden |
|------|---------------|-------|
| **Memory** | 4 GB (minimum), 6 GB (önerilen) | 5 container çalışacak |
| **CPUs** | 2 (minimum), 4 (önerilen) | Derleme ve çalışma için |
| **Disk** | 20 GB+ | Image'lar ve volume'lar |
| **WSL 2 Backend** | Açık (Windows) | Performans için |

### Adım B.3 - Proje Dosyalarını Alma

```bash
# Git ile
git clone https://github.com/Ecosfer-destek/ecosfer_CBAM.git
cd ecosfer_CBAM
```

### Adım B.4 - Tüm Servisleri Başlatma

```bash
# Proje kök dizininde çalıştırın (docker-compose.yml burada)
docker compose up -d
```

> **İlk çalıştırma 10-20 dakika sürebilir** — Docker image'lar indirilir ve projeler derlenir.

Çıktıyı takip etmek için:
```bash
docker compose logs -f
```

### Adım B.5 - Container Durumunu Kontrol Etme

```bash
docker compose ps
```

Beklenen çıktı — tüm servisler **Up (healthy)** olmalı:
```
NAME               STATUS              PORTS
ecosfer-db         Up (healthy)        0.0.0.0:5432->5432/tcp
ecosfer-redis      Up (healthy)        0.0.0.0:6379->6379/tcp
ecosfer-frontend   Up (healthy)        0.0.0.0:3000->3000/tcp
ecosfer-dotnet     Up (healthy)        0.0.0.0:5100->5100/tcp
ecosfer-ai         Up (healthy)        0.0.0.0:8000->8000/tcp
```

### Adım B.6 - Veritabanı Tablolarını ve Seed Verilerini Yükleme

```bash
# Frontend container'ına bağlan
docker compose exec frontend sh

# Container içinde:
npx prisma migrate deploy
# veya
npx prisma db push

# Seed verileri yükle
npx prisma db seed

# Çık
exit
```

### Adım B.7 - Tarayıcıdan Erişim

```
Frontend:       http://localhost:3000
.NET Swagger:   http://localhost:5100/swagger/ui
AI Health:      http://localhost:8000/health
```

### Adım B.8 - Servisleri Durdurma ve Başlatma

```bash
# Tüm servisleri durdur
docker compose down

# Tüm servisleri başlat
docker compose up -d

# Tek bir servisi yeniden başlat
docker compose restart frontend

# Logları izle
docker compose logs -f frontend
```

### Adım B.9 - Veritabanını Sıfırlama (Gerekirse)

```bash
# Tüm verileri sil ve yeniden oluştur
docker compose exec frontend sh -c "npx prisma db push --force-reset && npx prisma db seed"
```

---

## 4. Proje Dosyalarını Aktarma

Proje dosyalarını yeni bilgisayara aktarmanın 3 yolu:

### Yol 1: Git ile (Önerilen)

Yeni bilgisayarda:
```bash
git clone https://github.com/Ecosfer-destek/ecosfer_CBAM.git
cd ecosfer_CBAM
```

> En temiz yöntem. Güncelleme yapmak: `git pull origin master`

### Yol 2: PAKETLE.bat ile Paket Oluşturma (Windows)

Mevcut bilgisayarınızda:
1. `frontend/PAKETLE.bat` dosyasını çalıştırın
2. `C:\Users\90544\Desktop\Ecosfer_SKDM_Test_Ver2` klasörü oluşur
3. Bu klasörü ZIP'leyin
4. USB veya dosya paylaşımı ile aktarın

> **Not:** Bu yöntem sadece frontend klasörünü paketler. Docker kurulumu için
> projenin tamamı (kök dizin) gereklidir.

### Yol 3: Manuel ZIP ile Aktarma

Mevcut bilgisayarınızda:
```powershell
# Proje kök dizinini ZIP'le (gereksiz klasörler hariç)
# PowerShell ile:
$kaynak = "C:\Users\90544\Desktop\Ecosfer.SKDM.Panel\ecosfer-skdm-v2"
$hedef = "C:\Users\90544\Desktop\ecosfer-skdm-v2.zip"

# Önce node_modules ve diğer büyük klasörleri hariç tutarak kopyala
$temp = "$env:TEMP\ecosfer-pack"
if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }

robocopy $kaynak $temp /E /XD node_modules .next test-results playwright-report .auth coverage .turbo /XF *.log

Compress-Archive -Path "$temp\*" -DestinationPath $hedef -Force
Remove-Item $temp -Recurse -Force

Write-Host "Paket olusturuldu: $hedef"
```

Yeni bilgisayarda ZIP'i açın ve kuruluma devam edin.

### Aktarılması Gereken Dosya/Klasörler

| Dosya/Klasör | Gerekli mi? | Açıklama |
|-------------|-------------|----------|
| `frontend/` | EVET | Ana uygulama kodu |
| `services/dotnet/` | Docker için EVET | .NET doküman servisi |
| `services/ai/` | Docker için EVET | Python AI servisi |
| `docker/` | Docker için EVET | Nginx, Prometheus, Grafana config |
| `docker-compose.yml` | Docker için EVET | Geliştirme ortamı tanımı |
| `docker-compose.prod.yml` | Opsiyonel | Production ortamı tanımı |
| `.env` | HAYIR | Her bilgisayarda yeniden oluşturulmalı |
| `frontend/node_modules/` | HAYIR | `npm install` ile yeniden yüklenir |
| `frontend/.next/` | HAYIR | `npm run build` ile yeniden oluşur |
| `frontend/test-results/` | HAYIR | Test çıktıları |
| `frontend/playwright-report/` | HAYIR | E2E test raporları |

---

## 5. Giriş Bilgileri ve Test

### Varsayılan Kullanıcılar (Seed Verileri)

| E-posta | Şifre | Rol | Tenant |
|---------|-------|-----|--------|
| `info@ecosfer.com` | `Ankara3406.` | SUPER_ADMIN | Ecosfer |
| `info@roder.com` | `Ankara3406.` | COMPANY_ADMIN | Roder |
| `info@borubar.com` | `Ankara3406.` | COMPANY_ADMIN | Borubar |

> **Önemli:** İlk girişten sonra şifreleri değiştirin!

### Çalışması Beklenen Özellikler

| Özellik | Yöntem A (Basit) | Yöntem B (Docker) |
|---------|:----------------:|:-----------------:|
| Giriş/Çıkış | Evet | Evet |
| Dashboard (istatistik kartları, grafikler) | Evet | Evet |
| Şirketler CRUD | Evet | Evet |
| Tesisler CRUD | Evet | Evet |
| Tesis Verileri (A-E sekmeleri) | Evet | Evet |
| Emisyonlar CRUD (SS/PFC/ES) | Evet | Evet |
| Beyannameler (7 adım sihirbaz) | Evet | Evet |
| Tedarikçiler + Anket | Evet | Evet |
| Raporlar (bölüm ekleme) | Evet | Evet |
| CBAM Referans Verileri (6 sektör) | Evet | Evet |
| Kullanıcı/Rol Yönetimi | Evet | Evet |
| Dil değişimi (TR/EN/DE) | Evet | Evet |
| Tema değişimi (Açık/Koyu) | Evet | Evet |
| Excel Import (5 sayfa, 85+ hücre) | Hayır | Evet |
| Excel Export | Hayır | Evet |
| PDF Rapor (5 tür) | Hayır | Evet |
| XML Beyanname | Hayır | Evet |
| AI Tahmin/Anomali | Hayır | Evet* |

> *AI servisi için `ANTHROPIC_API_KEY` veya `OPENAI_API_KEY` gereklidir.

### Doğrulama Kontrol Listesi

- [ ] Tarayıcıda `http://localhost:3000` açılıyor
- [ ] `info@ecosfer.com` / `Ankara3406.` ile giriş yapılıyor
- [ ] Dashboard istatistik kartları veri gösteriyor
- [ ] Şirketler listesinde Ecosfer, Roder, Borubar görünüyor
- [ ] Yeni şirket oluşturulabiliyor
- [ ] Tesisler ve emisyon formları açılıyor
- [ ] Dil değiştirme (TR/EN/DE) çalışıyor
- [ ] Tema değiştirme (Açık/Koyu) çalışıyor
- [ ] CBAM Referans Verileri sayfası veri gösteriyor

---

## 6. Sorun Giderme

### Genel Sorunlar

#### `npm install` başarısız oluyor

```bash
# Node.js sürümünü kontrol et (v22+ olmalı)
node --version

# npm cache temizle ve tekrar dene
npm cache clean --force
npm install

# Eğer hala hata alıyorsanız, node_modules'ı sil ve tekrar dene
rm -rf node_modules package-lock.json
npm install
```

#### Port 3000 zaten kullanılıyor

```bash
# Hangi uygulama kullanıyor? (Windows)
netstat -ano | findstr :3000

# Farklı port ile başlat
npm run dev -- -p 3001
# Tarayıcıda http://localhost:3001 açın
```

```bash
# macOS/Linux
lsof -i :3000

# Farklı port ile başlat
npm run dev -- -p 3001
```

### PostgreSQL Sorunları (Yöntem A)

#### Veritabanına bağlanamıyor

```bash
# PostgreSQL servisinin çalıştığını kontrol edin
# Windows: services.msc > postgresql-x64-16 > Durumu: Çalışıyor
# macOS: brew services list
# Linux: sudo systemctl status postgresql
```

```bash
# Bağlantıyı test edin
psql -U postgres -h localhost -p 5432 -c "SELECT 1;"
# Şifre sorulduğunda kurulumda belirlediğiniz şifreyi girin
```

```bash
# Veritabanının var olduğunu kontrol edin
psql -U postgres -h localhost -c "\l" | grep ecosfer_skdm
# Yoksa oluşturun:
psql -U postgres -h localhost -c "CREATE DATABASE ecosfer_skdm;"
```

#### .env dosyasındaki şifre yanlış

```
# .env dosyasını açın ve DATABASE_URL'deki şifreyi kontrol edin
# postgres123 yerine kurulumda belirlediğiniz şifre olmalı
DATABASE_URL="postgresql://postgres:SIFRENIZ@localhost:5432/ecosfer_skdm?schema=public"
```

#### Prisma hatası

```bash
# Prisma client'ı yeniden oluştur
npx prisma generate

# Veritabanı tablolarını sıfırdan oluştur
npx prisma db push --force-reset

# Seed verilerini tekrar yükle
npm run db:seed
```

### Docker Sorunları (Yöntem B)

#### Docker Desktop başlamıyor (Windows)

1. WSL 2'nin kurulu olduğunu kontrol edin:
```powershell
wsl --status
```
2. Kurulu değilse:
```powershell
wsl --install
# Bilgisayarı yeniden başlatın
```
3. BIOS'ta Virtualization (VT-x/AMD-V) etkin olmalı

#### Container'lar başlamıyor

```bash
# Detaylı logları kontrol et
docker compose logs

# Belirli bir container
docker compose logs db
docker compose logs frontend

# Tümünü sıfırla ve yeniden başlat
docker compose down -v
docker compose up -d
```

#### "out of memory" hatası

Docker Desktop > Settings > Resources:
- Memory'yi 4 GB veya üzerine çıkarın
- Apply & Restart

#### Image build hatası

```bash
# Docker cache temizle ve yeniden dene
docker compose build --no-cache

# Tüm Docker önbelleğini temizle
docker system prune -af
docker compose up -d
```

#### Port çakışması (5432 veya 3000 kullanımda)

```bash
# Hangi portlar çakışıyor
docker compose ps

# Yerel PostgreSQL çalışıyorsa Docker ile çakışır
# Windows: services.msc > postgresql-x64-16 > Durdur
# macOS: brew services stop postgresql@16
# Linux: sudo systemctl stop postgresql

# Tekrar başlat
docker compose up -d
```

### Seed Sorunları

#### Seed hatası: "Unique constraint failed"

```bash
# Veritabanını sıfırla ve tekrar dene
# Yöntem A:
npx prisma db push --force-reset
npm run db:seed

# Yöntem B:
docker compose exec frontend sh -c "npx prisma db push --force-reset && npx prisma db seed"
```

#### Seed hatası: "Connection refused"

```
# PostgreSQL'in çalıştığından emin olun
# .env dosyasındaki DATABASE_URL'nin doğru olduğundan emin olun
```

---

## Ek: Hızlı Başlangıç Özeti

### Yöntem A — 6 Komut ile Kurulum

```bash
# 1. Repo'yu klonla
git clone https://github.com/Ecosfer-destek/ecosfer_CBAM.git && cd ecosfer_CBAM/frontend

# 2. .env dosyası oluştur (şifreyi kendi PostgreSQL şifrenizle değiştirin)
# (Yukarıdaki Adım A.4'teki içeriği .env dosyasına yapıştırın)

# 3. Bağımlılıkları yükle
npm install

# 4. Prisma client + tablolar
npx prisma generate && npx prisma db push

# 5. Seed verileri
npm run db:seed

# 6. Başlat
npm run dev
```

### Yöntem B — 3 Komut ile Kurulum

```bash
# 1. Repo'yu klonla
git clone https://github.com/Ecosfer-destek/ecosfer_CBAM.git && cd ecosfer_CBAM

# 2. Docker ile tümünü başlat
docker compose up -d

# 3. Veritabanı + seed
docker compose exec frontend sh -c "npx prisma db push && npx prisma db seed"
```

Her iki yöntemde de:
```
Adres:   http://localhost:3000
E-posta: info@ecosfer.com
Şifre:   Ankara3406.
```
