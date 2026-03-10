# Ecosfer CBAM - Claude Code Proje Talimatları

## Proje
Ecosfer SKDM v2.0 - CBAM Sürdürülebilirlik Karbon Düzenleme Mekanizması Paneli.
Next.js 16 + React 19 + Prisma 7 + PostgreSQL 16 (Docker) + shadcn/ui.

## Dil
Kullanıcı ile Türkçe iletişim kur.

## Oturum Kayıtları (Zorunlu)
Her konuşma sonunda kullanıcı istemese bile:
1. `docs/sessions/YYYY-MM-DD.md` dosyasına o oturumda yapılanları kaydet
2. `~/.claude/projects/C--ecosfer-CBAM/memory/MEMORY.md` dosyasını güncelle (yeni oturum linki ekle, yeni bilgileri ekle)
3. Aynı gün birden fazla oturum varsa dosya adına saat ekle: `YYYY-MM-DD_HHmm.md`

## Önemli Kurallar
- Veritabanı: Sadece PostgreSQL. SQLite kullanma.
- Docker container: `ecosfer-db` veya `ecosfer-postgres` adıyla çalışıyor
- Masaüstü yolu: `C:\Users\aydin\OneDrive\Masaüstü\` (OneDrive yönetimli)
- Seed dosyası `dotenv/config` importu gerektirir
- Commit sonrası `git push origin master` yap (kullanıcı onaylarsa)
