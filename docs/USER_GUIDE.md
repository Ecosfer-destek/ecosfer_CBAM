# Ecosfer SKDM v2.0 - Kullanıcı Kılavuzu

## İçindekiler

1. [Giriş](#1-giris)
2. [Sisteme Giriş ve Kullanıcı Yönetimi](#2-sisteme-giris-ve-kullanici-yonetimi)
3. [Dashboard (Ana Panel)](#3-dashboard-ana-panel)
4. [Şirket Yönetimi](#4-sirket-yonetimi)
5. [Tesis Yönetimi](#5-tesis-yonetimi)
6. [Tesis Verileri (Installation Data)](#6-tesis-verileri)
7. [Excel Veri Aktarımı](#7-excel-veri-aktarimi)
8. [Emisyon Yönetimi](#8-emisyon-yonetimi)
9. [Denge Tabloları](#9-denge-tablolari)
10. [CBAM Beyanname Yönetimi](#10-cbam-beyanname-yonetimi)
11. [Beyanname Sihirbazı](#11-beyanname-sihirbazi)
12. [Sertifika Yönetimi](#12-sertifika-yonetimi)
13. [İzleme Planı ve Yetkilendirme](#13-izleme-plani-ve-yetkilendirme)
14. [Tedarikçi Yönetimi](#14-tedarikci-yonetimi)
15. [Tedarikçi Portalı](#15-tedarikci-portali)
16. [AI Analiz Paneli](#16-ai-analiz-paneli)
17. [Raporlama](#17-raporlama)
18. [Ayarlar](#18-ayarlar)
19. [Dil Değiştirme](#19-dil-degistirme)

---

## 1. Giriş

Ecosfer SKDM (Sürdürülebilirlik ve Karbon Veri Yönetimi) platformu, AB CBAM (Sınırda Karbon Düzenleme Mekanizması) regülasyonuna uyum için geliştirilmiş kapsamlı bir veri yönetim sistemidir.

### Platform Özellikleri
- Tesis ve emisyon veri yönetimi
- Excel üzerinden toplu veri aktarımı (CBAM şablonu)
- CBAM beyanname oluşturma ve XML export
- PDF raporlama (TR/EN/DE)
- Tedarikçi anket yönetimi ve portalı
- AI destekli emisyon tahmini ve anomali tespiti
- Çok kiracılı (multi-tenant) mimari
- Rol tabanlı erişim kontrolü

### Desteklenen Tarayıcılar
- Chrome 90+, Firefox 90+, Edge 90+, Safari 15+

---

## 2. Sisteme Giriş ve Kullanıcı Yönetimi

### Giriş Yapma
1. Tarayıcıda `https://cbam.ecosfer.com` adresine gidin
2. E-posta ve şifrenizi girin
3. **Giriş Yap** butonuna tıklayın

### Şifre Gereksinimleri
- En az 8 karakter
- En az 1 büyük harf
- En az 1 rakam

### Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| Super Admin | Tüm sistem yönetimi, tenant oluşturma, kullanıcı yönetimi |
| Şirket Admin | Şirket ayarları, kullanıcı atama, tüm veri erişimi |
| Operatör | Tesis verileri, emisyon girişi, Excel aktarımı |
| CBAM Beyannameci | Beyanname oluşturma, XML/PDF üretimi |
| Doğrulayıcı | Beyanname doğrulama işlemleri |
| Tedarikçi | Sadece tedarikçi portalı erişimi |

### Kullanıcı Oluşturma (Super Admin / Şirket Admin)
1. Sol menüde **Ayarlar > Güvenlik** sayfasına gidin
2. **Yeni Kullanıcı** butonuna tıklayın
3. Ad, soyad, e-posta, şifre ve rol bilgilerini girin
4. **Oluştur** butonuna tıklayın

---

## 3. Dashboard (Ana Panel)

Sisteme giriş yaptığınızda ana panel görüntülenir. Panelde:

- **Özet Kartlar**: Toplam tesis sayısı, aktif beyanname, tedarikçi sayısı, emisyon özeti
- **Son Aktiviteler**: Son yapılan işlemler listesi
- **Hızlı Erişim**: Sık kullanılan sayfalara kısayollar

---

## 4. Şirket Yönetimi

### Şirket Listesi
Sol menüde **Şirketler** sayfasına gidin. Tüm kayıtlı şirketler listelenir.

### Yeni Şirket Oluşturma
1. **Yeni Şirket** butonuna tıklayın
2. Zorunlu alanlar:
   - Şirket adı
   - Ülke
   - Şehir
3. Opsiyonel: Vergi no, adres, iletişim bilgileri
4. **Kaydet** butonuna tıklayın

### Şirket Düzenleme
1. Listede ilgili şirketin satırına tıklayın
2. Detay sayfasında **Düzenle** butonuna tıklayın
3. Değişiklikleri yapın ve **Kaydet**

---

## 5. Tesis Yönetimi

### Tesis Listesi
Sol menüde **Tesisler** sayfasına gidin.

### Yeni Tesis Oluşturma
1. **Yeni Tesis** butonuna tıklayın
2. Zorunlu alanlar:
   - Tesis adı
   - Bağlı şirket (dropdown)
   - Ülke
   - Şehir
3. Opsiyonel: Adres, koordinat, üretim kapasitesi
4. **Kaydet**

### Tesis Detayları
Tesis satırına tıkladığınızda detay sayfası açılır. Buradan:
- Tesise ait **Installation Data** kayıtları görüntülenir
- Yeni dönem verisi eklenebilir

---

## 6. Tesis Verileri

Tesis verileri (InstallationData) CBAM raporlaması için temel veri birimidir. Her kayıt belirli bir döneme ait tesis verilerini içerir.

### 5 Sekmeli Form
Tesis verisi detay sayfasında 5 sekme bulunur:

1. **Genel Bilgiler**: Dönem, tesis bilgileri, üretim aktiviteleri
2. **Mallar ve Rotalar**: İthal edilen mallar, CN kodları, üretim rotaları
3. **Emisyonlar**: Doğrudan ve dolaylı emisyon kayıtları
4. **Enerji Dengeleri**: Yakıt ve GHG denge tabloları
5. **Belgeler**: Excel import, XML export, PDF raporlar

### Yeni Tesis Verisi Ekleme
1. Tesis detay sayfasından **Yeni Dönem Verisi** butonuna tıklayın
2. Dönem yılını seçin
3. Form sekmelerini doldurun
4. **Kaydet**

---

## 7. Excel Veri Aktarımı

CBAM Excel şablonu üzerinden toplu veri aktarımı yapabilirsiniz. Excel dosyası 5 sheet içerir:

| Sheet | İçerik |
|-------|--------|
| A_InstData | Tesis genel verileri |
| B_EmInst | Emisyon tesis verileri |
| C_Emissions&Energy | Emisyon ve enerji verileri |
| D_Processes | Proses verileri |
| E_PurchPrec | Satın alma verileri |

### Import Adımları
1. Tesis verisi detay sayfasına gidin
2. **Belgeler** sekmesine geçin
3. **Excel Import** butonuna tıklayın
4. CBAM şablonundaki Excel dosyasını seçin
5. Yükleme otomatik başlar ve ilerleme çubuğu görünür
6. Tamamlandığında her sheet için sonuç gösterilir:
   - Başarılı satırlar (yeşil)
   - Hatalı satırlar (kırmızı) - hata mesajları ile birlikte

### Önemli Notlar
- Excel dosyası CBAM resmi şablonuna uygun olmalıdır
- Maksimum dosya boyutu: 50MB
- Desteklenen format: .xlsx
- Import işlemi mevcut verilerin üzerine yazar

---

## 8. Emisyon Yönetimi

### Emisyon Listesi
Sol menüde **Emisyonlar** sayfasına gidin. Tüm emisyon kayıtları filtrelenebilir tablo halinde listelenir.

### Yeni Emisyon Ekleme
1. **Yeni Emisyon** butonuna tıklayın
2. Emisyon türüne göre koşullu form görünür:
   - **SS (Spesifik Sera Gazı)**: CO2, N2O, PFC değerleri
   - **PFC (Perfluorokarbon)**: PFC spesifik alanlar
   - **ES (Enerji Kaynakları)**: Yakıt bazlı emisyon verileri
3. Tesis verisi ile ilişkilendirin
4. **Kaydet**

### Emisyon Düzenleme
1. Listede emisyon satırına tıklayın
2. Değerleri güncelleyin
3. **Kaydet**

---

## 9. Denge Tabloları

### Yakıt Dengesi (Fuel Balance)
- Tesis bazında yakıt tüketimi ve emisyon kayıtları
- Yakıt tipi, miktar, birim, emisyon faktörü

### GHG Dengesi (GHG Balance)
İki tip GHG dengesi vardır:
1. **Türe Göre** (GhgBalanceByType): Emisyon türüne göre toplam değerler
2. **İzleme Metodolojisine Göre** (GhgBalanceByMonitoringMethodologyType): İzleme yöntemine göre dağılım

---

## 10. CBAM Beyanname Yönetimi

### Beyanname Listesi
Sol menüde **Beyannameler** sayfasına gidin.

### Yeni Beyanname Oluşturma
1. **Yeni Beyanname** butonuna tıklayın
2. Zorunlu alanlar:
   - Beyanname yılı (2023-2030)
   - Dönem (çeyrek/yıllık)
   - Bağlı tesis
3. **Kaydet**

### Beyanname Detayları
Beyanname detay sayfasında:
- Beyanname bilgileri ve durum
- İlişkili mallar ve emisyonlar
- **XML Oluştur** butonu ile CBAM XML dosyası üretimi
- **XML İndir** butonu ile XML dosya indirme
- XSD doğrulama sonuçları

---

## 11. Beyanname Sihirbazı

7 adımlı interaktif sihirbaz ile yeni beyanname oluşturabilirsiniz:

### Adım 1: Tesis ve Yıl Seçimi
- Listeden tesis seçin
- Beyanname yılını seçin

### Adım 2: İthal Mallar
- Tesis verisine bağlı malları görüntüleyin
- Beyanname kapsamına dahil edilecek malları seçin

### Adım 3: Emisyonlar
- Seçilen mallara ait emisyon verilerini görüntüleyin
- Emisyon değerlerini doğrulayın

### Adım 4: Sertifika Teslimi
- CBAM sertifika teslim bilgilerini girin
- Teslim edilen sertifika miktarı

### Adım 5: Ücretsiz Tahsis
- Ücretsiz tahsis düzeltmelerini girin
- Menşei ülke bazında ücretsiz tahsis

### Adım 6: Doğrulama
- Doğrulayıcı bilgilerini girin
- Doğrulama durumu

### Adım 7: İnceleme ve Gönderme
- Tüm verileri inceleyin
- **Beyanname Oluştur** butonuna tıklayın
- Sistem otomatik olarak XML ve PDF oluşturur

---

## 12. Sertifika Yönetimi

### CBAM Sertifikaları
- Sol menüde **Sertifikalar** sayfasına gidin
- Sertifika oluşturma, görüntüleme, düzenleme

### Sertifika Teslimi
- Beyanname ile ilişkili sertifika teslim kayıtları
- Satır içi (inline) düzenleme

### Ücretsiz Tahsis Düzeltmesi
- Menşei ülke bazında ücretsiz tahsis kayıtları
- Satır içi (inline) düzenleme

---

## 13. İzleme Planı ve Yetkilendirme

### İzleme Planı (Monitoring Plan)
- Sol menüde **İzleme Planları** sayfasına gidin
- Tesis bazında izleme metodolojisi tanımlama
- Plan durumu takibi

### Yetkilendirme Başvurusu (Authorisation Application)
- Sol menüde **Yetkilendirme** sayfasına gidin
- CBAM yetkili beyannameci başvurusu
- Doğrulama durumu sayfası

---

## 14. Tedarikçi Yönetimi

### Tedarikçi Listesi
Sol menüde **Tedarikçiler** sayfasına gidin.

### Yeni Tedarikçi Ekleme
1. **Yeni Tedarikçi** butonuna tıklayın
2. Bilgileri girin:
   - Şirket adı
   - E-posta
   - Telefon
   - Ülke
3. **Oluştur**

### Davet Gönderme
1. Tedarikçi listesinde ilgili satırdaki **Davet Gönder** butonuna tıklayın
2. Sistem otomatik davet e-postası gönderir
3. Tedarikçi, davet linkindeki benzersiz token ile portala erişir

### Tedarikçi Detayları
- Tedarikçi bilgileri
- Anket durumu (beklemede/gönderildi/tamamlandı)
- Tanımlanan mallar ve CN kodları

---

## 15. Tedarikçi Portalı

Tedarikçiler için ayrı bir portal sunulur. Tedarikçi davet linkine tıkladığında:

### Dashboard
- Toplam anket, bekleyen anket, tanımlanan mal sayısı
- Son anketler listesi

### Anketler
1. **Yeni Anket** ile boş anket oluşturun
2. Emisyon verilerini girin
3. **Gönder** ile anketi tamamlayın

### Mallar
- Tedarik edilen malları tanımlayın
- CN kodu ve açıklama girin

### Profil
- Şirket bilgilerini güncelleyin

---

## 16. AI Analiz Paneli

Sol menüde **AI Analiz** sayfasına gidin. Üç sekme mevcuttur:

### Emisyon Tahmini
1. Analiz edilecek tesisi seçin
2. Tahmin dönemi sayısını belirleyin (1-24)
3. **Tahmin Oluştur** butonuna tıklayın
4. Sonuçlar:
   - Geçmiş emisyon verileri (grafik)
   - Gelecek tahminleri (güven aralıkları ile)
   - Trend bilgisi (yükseliş/düşüş yüzde)
   - Kullanılan model (XGBoost/LinearRegression)
   - R2 skoru (model doğruluğu)

### Anomali Tespiti
1. Tesisi seçin
2. Hassasiyet eşiğini ayarlayın (0.01-0.5)
3. **Analiz Et** butonuna tıklayın
4. Sonuçlar:
   - Tespit edilen anomaliler listesi (kritik/uyarı/bilgi)
   - Her anomali için açıklama ve etkilenen değerler
   - Veri kalite skoru (0-1)
   - Anomali türleri: denge uyumsuzluğu, ani değişim, negatif değer

### Akıllı Raporlama
1. Tesisi seçin
2. Rapor tipi: Özet / Detaylı / Yönetici
3. Dil: Türkçe / İngilizce / Almanca
4. **Rapor Oluştur** butonuna tıklayın
5. AI tarafından oluşturulan metin raporu görüntülenir
6. Claude veya GPT-4 kullanılır (API key yoksa şablon tabanlı fallback)

---

## 17. Raporlama

### PDF Rapor Üretimi
Tesis verisi detay sayfasından PDF rapor oluşturabilirsiniz:

1. **Belgeler** sekmesine geçin
2. **PDF Rapor Oluştur** butonuna tıklayın
3. Rapor tipini seçin:
   - **Tesis Özet Raporu**: Tesis genel bilgileri ve emisyon özeti
   - **Beyanname Raporu**: CBAM beyanname detayları
   - **Emisyon Detay Raporu**: Detaylı emisyon verileri
   - **Tedarikçi Anket Raporu**: Tedarikçi anket sonuçları
   - **Özel Rapor**: Kullanıcı tanımlı rapor
4. Dil seçin (TR/EN/DE)
5. **Oluştur** butonuna tıklayın
6. PDF otomatik indirilir

### XML Export
Beyanname detay sayfasından:
1. **XML Oluştur** butonuna tıklayın
2. Sistem CBAM XSD şemasına göre XML üretir
3. XSD doğrulama sonuçları gösterilir
4. **XML İndir** ile dosyayı indirin
5. SHA-256 bütünlük hash'i eklenir

---

## 18. Ayarlar

### Tenant Ayarları
- Şirket genel bilgileri
- Varsayılan dil ve para birimi
- CBAM beyanname varsayılanları

### Güvenlik
- Kullanıcı listesi ve yönetimi
- Şifre değiştirme
- Rol atama

---

## 19. Dil Değiştirme

Platform 3 dilde kullanılabilir:
- **Türkçe** (varsayılan)
- **English**
- **Deutsch**

Dil değiştirmek için:
1. Sağ üst köşedeki dil seçiciye tıklayın
2. İstediğiniz dili seçin
3. Sayfa otomatik yenilenir

Not: Dil tercihi çerez (cookie) ile saklanır ve sonraki oturumlarda hatırlanır.

---

## Destek

Teknik destek için: destek@ecosfer.com

Sistem durumu: `https://cbam.ecosfer.com/api/health`
