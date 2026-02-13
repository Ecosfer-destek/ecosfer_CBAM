# Ecosfer SKDM v2.0 - Kullanici Kilavuzu

## Icindekiler

1. [Giris](#1-giris)
2. [Sisteme Giris ve Kullanici Yonetimi](#2-sisteme-giris-ve-kullanici-yonetimi)
3. [Dashboard (Ana Panel)](#3-dashboard-ana-panel)
4. [Sirket Yonetimi](#4-sirket-yonetimi)
5. [Tesis Yonetimi](#5-tesis-yonetimi)
6. [Tesis Verileri (Installation Data)](#6-tesis-verileri)
7. [Excel Veri Aktarimi](#7-excel-veri-aktarimi)
8. [Emisyon Yonetimi](#8-emisyon-yonetimi)
9. [Denge Tablolari](#9-denge-tablolari)
10. [CBAM Beyanname Yonetimi](#10-cbam-beyanname-yonetimi)
11. [Beyanname Sihirbazi](#11-beyanname-sihirbazi)
12. [Sertifika Yonetimi](#12-sertifika-yonetimi)
13. [Izleme Plani ve Yetkilendirme](#13-izleme-plani-ve-yetkilendirme)
14. [Tedarikci Yonetimi](#14-tedarikci-yonetimi)
15. [Tedarikci Portali](#15-tedarikci-portali)
16. [AI Analiz Paneli](#16-ai-analiz-paneli)
17. [Raporlama](#17-raporlama)
18. [Ayarlar](#18-ayarlar)
19. [Dil Degistirme](#19-dil-degistirme)

---

## 1. Giris

Ecosfer SKDM (Surdurulebilirlik ve Karbon Veri Yonetimi) platformu, AB CBAM (Sinirda Karbon Duzenleme Mekanizmasi) regulasyonuna uyum icin gelistirilmis kapsamli bir veri yonetim sistemidir.

### Platform Ozellikleri
- Tesis ve emisyon veri yonetimi
- Excel uzerinden toplu veri aktarimi (CBAM sablonu)
- CBAM beyanname olusturma ve XML export
- PDF raporlama (TR/EN/DE)
- Tedarikci anket yonetimi ve portali
- AI destekli emisyon tahmini ve anomali tespiti
- Cok kiracili (multi-tenant) mimari
- Rol tabanli erisim kontrolu

### Desteklenen Tarayicilar
- Chrome 90+, Firefox 90+, Edge 90+, Safari 15+

---

## 2. Sisteme Giris ve Kullanici Yonetimi

### Giris Yapma
1. Tarayicida `https://cbam.ecosfer.com` adresine gidin
2. E-posta ve sifrenizi girin
3. **Giris Yap** butonuna tiklayin

### Sifre Gereksinimleri
- En az 8 karakter
- En az 1 buyuk harf
- En az 1 rakam

### Kullanici Rolleri

| Rol | Yetkiler |
|-----|----------|
| Super Admin | Tum sistem yonetimi, tenant olusturma, kullanici yonetimi |
| Sirket Admin | Sirket ayarlari, kullanici atama, tum veri erisimi |
| Operator | Tesis verileri, emisyon girisi, Excel aktarimi |
| CBAM Beyannameci | Beyanname olusturma, XML/PDF uretimi |
| Dogrulayici | Beyanname dogrulama islemleri |
| Tedarikci | Sadece tedarikci portali erisimi |

### Kullanici Olusturma (Super Admin / Sirket Admin)
1. Sol menude **Ayarlar > Guvenlik** sayfasina gidin
2. **Yeni Kullanici** butonuna tiklayin
3. Ad, soyad, e-posta, sifre ve rol bilgilerini girin
4. **Olustur** butonuna tiklayin

---

## 3. Dashboard (Ana Panel)

Sisteme giris yaptiginizda ana panel goruntulenir. Panelde:

- **Ozet Kartlar**: Toplam tesis sayisi, aktif beyanname, tedarikci sayisi, emisyon ozeti
- **Son Aktiviteler**: Son yapilan islemler listesi
- **Hizli Erisim**: Sik kullanilan sayfalara kisayollar

---

## 4. Sirket Yonetimi

### Sirket Listesi
Sol menude **Sirketler** sayfasina gidin. Tum kayitli sirketler listelenir.

### Yeni Sirket Olusturma
1. **Yeni Sirket** butonuna tiklayin
2. Zorunlu alanlar:
   - Sirket adi
   - Ulke
   - Sehir
3. Opsiyonel: Vergi no, adres, iletisim bilgileri
4. **Kaydet** butonuna tiklayin

### Sirket Duzenleme
1. Listede ilgili sirketin satirina tiklayin
2. Detay sayfasinda **Duzenle** butonuna tiklayin
3. Degisiklikleri yapin ve **Kaydet**

---

## 5. Tesis Yonetimi

### Tesis Listesi
Sol menude **Tesisler** sayfasina gidin.

### Yeni Tesis Olusturma
1. **Yeni Tesis** butonuna tiklayin
2. Zorunlu alanlar:
   - Tesis adi
   - Bagli sirket (dropdown)
   - Ulke
   - Sehir
3. Opsiyonel: Adres, koordinat, uretim kapasitesi
4. **Kaydet**

### Tesis Detaylari
Tesis satirina tikladiginizda detay sayfasi acilir. Buradan:
- Tesise ait **Installation Data** kayitlari goruntulenir
- Yeni donem verisi eklenebilir

---

## 6. Tesis Verileri

Tesis verileri (InstallationData) CBAM raporlamasi icin temel veri birimidir. Her kayit belirli bir doneme ait tesis verilerini icerir.

### 5 Sekmeli Form
Tesis verisi detay sayfasinda 5 sekme bulunur:

1. **Genel Bilgiler**: Donem, tesis bilgileri, uretim aktiviteleri
2. **Mallar ve Rotalar**: Ithal edilen mallar, CN kodlari, uretim rotalari
3. **Emisyonlar**: Dogrudan ve dolayli emisyon kayitlari
4. **Enerji Dengeleri**: Yakit ve GHG denge tablolari
5. **Belgeler**: Excel import, XML export, PDF raporlar

### Yeni Tesis Verisi Ekleme
1. Tesis detay sayfasindan **Yeni Donem Verisi** butonuna tiklayin
2. Donem yilini secin
3. Form sekmelerini doldurun
4. **Kaydet**

---

## 7. Excel Veri Aktarimi

CBAM Excel sablonu uzerinden toplu veri aktarimi yapabilirsiniz. Excel dosyasi 5 sheet icerir:

| Sheet | Icerik |
|-------|--------|
| A_InstData | Tesis genel verileri |
| B_EmInst | Emisyon tesis verileri |
| C_Emissions&Energy | Emisyon ve enerji verileri |
| D_Processes | Proses verileri |
| E_PurchPrec | Satin alma verileri |

### Import Adimlari
1. Tesis verisi detay sayfasina gidin
2. **Belgeler** sekmesine gecin
3. **Excel Import** butonuna tiklayin
4. CBAM sablonundaki Excel dosyasini secin
5. Yukleme otomatik baslar ve ilerleme cubugu gorunur
6. Tamamlandiginda her sheet icin sonuc gosterilir:
   - Basarili satirlar (yesil)
   - Hatali satirlar (kirmizi) - hata mesajlari ile birlikte

### Onemli Notlar
- Excel dosyasi CBAM resmi sablonuna uygun olmalidir
- Maksimum dosya boyutu: 50MB
- Desteklenen format: .xlsx
- Import islemi mevcut verilerin uzerine yazar

---

## 8. Emisyon Yonetimi

### Emisyon Listesi
Sol menude **Emisyonlar** sayfasina gidin. Tum emisyon kayitlari filtrelenebilir tablo halinde listelenir.

### Yeni Emisyon Ekleme
1. **Yeni Emisyon** butonuna tiklayin
2. Emisyon turune gore kosullu form gorunur:
   - **SS (Spesifik Sera Gazi)**: CO2, N2O, PFC degerleri
   - **PFC (Perfluorokarbon)**: PFC spesifik alanlar
   - **ES (Enerji Kaynaklari)**: Yakit bazli emisyon verileri
3. Tesis verisi ile iliskilendirin
4. **Kaydet**

### Emisyon Duzenleme
1. Listede emisyon satirina tiklayin
2. Degerleri guncelleyin
3. **Kaydet**

---

## 9. Denge Tablolari

### Yakit Dengesi (Fuel Balance)
- Tesis bazinda yakit tuketimi ve emisyon kayitlari
- Yakit tipi, miktar, birim, emisyon faktoru

### GHG Dengesi (GHG Balance)
Iki tip GHG dengesi vardir:
1. **Ture Gore** (GhgBalanceByType): Emisyon turune gore toplam degerler
2. **Izleme Metodolojisine Gore** (GhgBalanceByMonitoringMethodologyType): Izleme yontemine gore dagilim

---

## 10. CBAM Beyanname Yonetimi

### Beyanname Listesi
Sol menude **Beyannameler** sayfasina gidin.

### Yeni Beyanname Olusturma
1. **Yeni Beyanname** butonuna tiklayin
2. Zorunlu alanlar:
   - Beyanname yili (2023-2030)
   - Donem (ceyrek/yillik)
   - Bagli tesis
3. **Kaydet**

### Beyanname Detaylari
Beyanname detay sayfasinda:
- Beyanname bilgileri ve durum
- Iliskili mallar ve emisyonlar
- **XML Olustur** butonu ile CBAM XML dosyasi uretimi
- **XML Indir** butonu ile XML dosya indirme
- XSD dogrulama sonuclari

---

## 11. Beyanname Sihirbazi

7 adimli interaktif sihirbaz ile yeni beyanname olusturabilirsiniz:

### Adim 1: Tesis ve Yil Secimi
- Listeden tesis secin
- Beyanname yilini secin

### Adim 2: Ithal Mallar
- Tesis verisine bagli mallari goruntuleyin
- Beyanname kapsamina dahil edilecek mallari secin

### Adim 3: Emisyonlar
- Secilen mallara ait emisyon verilerini goruntuleyin
- Emisyon degerlerini dogrulayin

### Adim 4: Sertifika Teslimi
- CBAM sertifika teslim bilgilerini girin
- Teslim edilen sertifika miktari

### Adim 5: Ucretsiz Tahsis
- Ucretsiz tahsis duzeltmelerini girin
- Mensei ulke bazinda ucretsiz tahsis

### Adim 6: Dogrulama
- Dogrulayici bilgilerini girin
- Dogrulama durumu

### Adim 7: Inceleme ve Gonderme
- Tum verileri inceleyin
- **Beyanname Olustur** butonuna tiklayin
- Sistem otomatik olarak XML ve PDF olusturur

---

## 12. Sertifika Yonetimi

### CBAM Sertifikalari
- Sol menude **Sertifikalar** sayfasina gidin
- Sertifika olusturma, goruntuleme, duzenleme

### Sertifika Teslimi
- Beyanname ile iliskili sertifika teslim kayitlari
- Satir ici (inline) duzenleme

### Ucretsiz Tahsis Duzeltmesi
- Mensei ulke bazinda ucretsiz tahsis kayitlari
- Satir ici (inline) duzenleme

---

## 13. Izleme Plani ve Yetkilendirme

### Izleme Plani (Monitoring Plan)
- Sol menude **Izleme Planlari** sayfasina gidin
- Tesis bazinda izleme metodolojisi tanimlama
- Plan durumu takibi

### Yetkilendirme Basvurusu (Authorisation Application)
- Sol menude **Yetkilendirme** sayfasina gidin
- CBAM yetkili beyannameci basvurusu
- Dogrulama durumu sayfasi

---

## 14. Tedarikci Yonetimi

### Tedarikci Listesi
Sol menude **Tedarikciler** sayfasina gidin.

### Yeni Tedarikci Ekleme
1. **Yeni Tedarikci** butonuna tiklayin
2. Bilgileri girin:
   - Sirket adi
   - E-posta
   - Telefon
   - Ulke
3. **Olustur**

### Davet Gonderme
1. Tedarikci listesinde ilgili satirdaki **Davet Gonder** butonuna tiklayin
2. Sistem otomatik davet e-postasi gonderir
3. Tedarikci, davet linkindeki benzersiz token ile portala erisir

### Tedarikci Detaylari
- Tedarikci bilgileri
- Anket durumu (beklemede/gonderildi/tamamlandi)
- Tanimlanan mallar ve CN kodlari

---

## 15. Tedarikci Portali

Tedarikciler icin ayri bir portal sunulur. Tedarikci davet linkine tikladiginda:

### Dashboard
- Toplam anket, bekleyen anket, tanimlanan mal sayisi
- Son anketler listesi

### Anketler
1. **Yeni Anket** ile bos anket olusturun
2. Emisyon verilerini girin
3. **Gonder** ile anketi tamamlayin

### Mallar
- Tedarik edilen mallari tanimlayin
- CN kodu ve aciklama girin

### Profil
- Sirket bilgilerini guncelleyin

---

## 16. AI Analiz Paneli

Sol menude **AI Analiz** sayfasina gidin. Uc sekme mevcuttur:

### Emisyon Tahmini
1. Analiz edilecek tesisi secin
2. Tahmin donemi sayisini belirleyin (1-24)
3. **Tahmin Olustur** butonuna tiklayin
4. Sonuclar:
   - Gecmis emisyon verileri (grafik)
   - Gelecek tahminleri (guven araliklari ile)
   - Trend bilgisi (yukselis/dusus yuzde)
   - Kullanilan model (XGBoost/LinearRegression)
   - R2 skoru (model dogrulugu)

### Anomali Tespiti
1. Tesisi secin
2. Hassasiyet esigini ayarlayin (0.01-0.5)
3. **Analiz Et** butonuna tiklayin
4. Sonuclar:
   - Tespit edilen anomaliler listesi (kritik/uyari/bilgi)
   - Her anomali icin aciklama ve etkilenen degerler
   - Veri kalite skoru (0-1)
   - Anomali turleri: denge uyumsuzlugu, ani degisim, negatif deger

### Akilli Raporlama
1. Tesisi secin
2. Rapor tipi: Ozet / Detayli / Yonetici
3. Dil: Turkce / Ingilizce / Almanca
4. **Rapor Olustur** butonuna tiklayin
5. AI tarafindan olusturulan metin raporu goruntulenir
6. Claude veya GPT-4 kullanilir (API key yoksa sablon tabanli fallback)

---

## 17. Raporlama

### PDF Rapor Uretimi
Tesis verisi detay sayfasindan PDF rapor olusturabilirsiniz:

1. **Belgeler** sekmesine gecin
2. **PDF Rapor Olustur** butonuna tiklayin
3. Rapor tipini secin:
   - **Tesis Ozet Raporu**: Tesis genel bilgileri ve emisyon ozeti
   - **Beyanname Raporu**: CBAM beyanname detaylari
   - **Emisyon Detay Raporu**: Detayli emisyon verileri
   - **Tedarikci Anket Raporu**: Tedarikci anket sonuclari
   - **Ozel Rapor**: Kullanici tanimli rapor
4. Dil secin (TR/EN/DE)
5. **Olustur** butonuna tiklayin
6. PDF otomatik indirilir

### XML Export
Beyanname detay sayfasindan:
1. **XML Olustur** butonuna tiklayin
2. Sistem CBAM XSD semasina gore XML uretir
3. XSD dogrulama sonuclari gosterilir
4. **XML Indir** ile dosyayi indirin
5. SHA-256 butunluk hash'i eklenir

---

## 18. Ayarlar

### Tenant Ayarlari
- Sirket genel bilgileri
- Varsayilan dil ve para birimi
- CBAM beyanname varsayilanlari

### Guvenlik
- Kullanici listesi ve yonetimi
- Sifre degistirme
- Rol atama

---

## 19. Dil Degistirme

Platform 3 dilde kullanilabilir:
- **Turkce** (varsayilan)
- **English**
- **Deutsch**

Dil degistirmek icin:
1. Sag ust kosedeki dil seciciye tiklayin
2. Istediginiz dili secin
3. Sayfa otomatik yenilenir

Not: Dil tercihi cerez (cookie) ile saklanir ve sonraki oturumlarda hatirlanir.

---

## Destek

Teknik destek icin: destek@ecosfer.com

Sistem durumu: `https://cbam.ecosfer.com/api/health`
