# Ecosfer SKDM v2.0 - Lokal Test Ortamı Kurulumu

## Bağlam
Uygulama Ecosfer bünyesinde test edilecek. AI modülü şimdilik devre dışı. Amaç: en minimal kurulumla çalışan bir test ortamı (sadece Frontend + PostgreSQL). Feedback'lere göre iyileştirmeler yapılacak.

## Mevcut Durum
- **Node.js v24.11.1**: MEVCUT
- **PostgreSQL**: YOK (kurulması gerekiyor)
- **Redis**: GEREKLI DEĞİL (frontend kodunda hiç kullanılmıyor)
- **Docker**: YOK (bu yaklaşımda gerekli değil)
- **node_modules**: YOK (`npm install` gerekli)
- **.env**: VAR ama DB URL'i eski WSL IP'sine işaret ediyor, güncellenecek

## Kurulum Adımları

### Adım 1: PostgreSQL 16 Kur (Windows Installer)
- https://www.postgresql.org/download/windows/ adresinden PostgreSQL 16 indir
- Kurulum sırasında:
  - **Şifre:** `postgres123` (veya istediğin bir şifre)
  - **Port:** `5432` (varsayılan)
  - **Locale:** Turkish, Turkey (veya default)
  - Stack Builder'ı atla (gerek yok)
- Kurulumdan sonra pgAdmin veya psql ile DB oluştur:

```sql
CREATE DATABASE ecosfer_skdm;
```

### Adım 2: Frontend .env Dosyasını Güncelle
`ecosfer-skdm-v2/frontend/.env` dosyasını localhost'a çevir:

```env
# Database (localhost PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ecosfer_skdm?schema=public"

# Redis - boş bırakılabilir, frontend kullanmıyor
REDIS_URL=""

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ecosfer-skdm-dev-secret-change-in-production-2026"
AUTH_SECRET="ecosfer-skdm-dev-secret-change-in-production-2026"

# .NET ve AI - şimdilik devre dışı (boş bırak)
DOTNET_SERVICE_URL=""
AI_SERVICE_URL=""
```

**NOT:** `postgres123` yerine kurulumda verdiğin şifreyi yaz.

### Adım 3: Bağımlılıkları Yükle
```powershell
cd C:\Users\90544\Desktop\Ecosfer.SKDM.Panel\ecosfer-skdm-v2\frontend
npm install
```
Bu ~2-3 dakika sürebilir (ilk kurulum).

### Adım 4: Prisma Client Oluştur + DB Şemasını Yükle
```powershell
# Prisma client generate
npx prisma generate

# DB tablolarını oluştur (82 model)
npx prisma db push
```

### Adım 5: Seed Data Yükle
```powershell
npm run db:seed
```
Bu komut 12 adımda şunları yükler:
- 3 tenant (Ecosfer, Roder, Borubar)
- Admin kullanıcılar (info@ecosfer.com / Ankara3406.)
- 39+ ülke, 30+ şehir, 26+ ilçe
- 60+ CN kodu, birimler, roller
- Örnek şirket ve tesis verileri

### Adım 6: Uygulamayı Başlat
```powershell
npm run dev
```
Tarayıcıda **http://localhost:3000** aç.

### Adım 7: Giriş Yap ve Test Et
- **E-posta:** `info@ecosfer.com`
- **Şifre:** `Ankara3406.`
- Rol: SUPER_ADMIN (tüm sayfalara erişim)

## Çalışacak Özellikler
| Modül | Durum | Not |
|-------|-------|-----|
| Dashboard | ÇALIŞIR | İstatistik kartları, grafikler |
| Şirketler CRUD | ÇALIŞIR | Oluştur, düzenle, sil |
| Tesisler CRUD | ÇALIŞIR | Oluştur, düzenle, sil |
| Tesis Verileri (5 tab) | ÇALIŞIR | A-E sekmeleri, emisyon girişi |
| Emisyonlar CRUD | ÇALIŞIR | SS/PFC/ES formları |
| Beyannameler | ÇALIŞIR | Liste + 7-adım sihirbaz |
| Tedarikçiler + Anket | ÇALIŞIR | CRUD + anket yönetimi |
| Raporlar | ÇALIŞIR | Rapor oluştur/bölüm ekle |
| CBAM Referans Verileri | ÇALIŞIR | 6 sektör referans tabloları |
| Kullanıcı/Rol Yönetimi | ÇALIŞIR | Admin panel |
| i18n (TR/EN/DE) | ÇALIŞIR | Dil değiştirme |
| Excel Import/Export | ÇALIŞMAZ | .NET servisi gerekli |
| PDF Rapor Oluşturma | ÇALIŞMAZ | .NET servisi gerekli |
| XML Export | ÇALIŞMAZ | .NET servisi gerekli |
| AI Analiz/Tahmin | ÇALIŞMAZ | Python servisi + API key gerekli |

## Doğrulama Checklist
1. http://localhost:3000 açılıyor mu?
2. Login başarılı mı? (info@ecosfer.com / Ankara3406.)
3. Dashboard istatistikleri yükleniyor mu?
4. Şirketler listesi veri gösteriyor mu?
5. Yeni şirket oluşturulabiliyor mu?
6. Tesisler ve emisyon formları açılıyor mu?
7. Dil değiştirme (TR/EN/DE) çalışıyor mu?

## Sorun Giderme
- **DB bağlantı hatası:** PostgreSQL servisinin çalıştığını kontrol et (`services.msc` > postgresql-x64-16)
- **Prisma hatası:** `npx prisma generate` tekrar çalıştır
- **Port çakışması:** 3000 portu başka uygulama kullanıyorsa `npm run dev -- -p 3001`
- **Seed hatası:** DB'yi sıfırla: `npx prisma db push --force-reset` sonra tekrar `npm run db:seed`
