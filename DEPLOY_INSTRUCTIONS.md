# Ecosfer SKDM v2.0 - Production Deploy Talimatları

> Bu dosyadaki adımları sırayla uygula. Her adımı tamamladıktan sonra bir sonrakine geç.
> Hedef: Windows 11 + Docker Desktop ile tüm 11 servisi ayağa kaldır.

---

## ÖNKOŞUL: Docker Desktop Doğrulama

Docker Desktop'ın kurulu ve çalışıyor olduğunu doğrula:

```powershell
docker --version
docker compose version
```

Her iki komut da başarıyla çalışıyorsa devam et. Çalışmıyorsa Docker Desktop uygulamasını aç ve WSL2 backend'inin aktif olduğunu kontrol et.

---

## ADIM 1: Production .env Dosyası Oluştur

`ecosfer-skdm-v2/.env` dosyasını aşağıdaki içerikle oluştur. Şifreleri güçlü random değerlerle doldur (openssl rand -hex 24 veya benzeri ile üret):

```env
# Database
DB_USER=ecosfer
DB_PASSWORD=<32-karakter-random-şifre>
DB_NAME=ecosfer_skdm

# Redis
REDIS_PASSWORD=<24-karakter-random-şifre>

# NextAuth (localhost için)
NEXTAUTH_URL=http://localhost
NEXTAUTH_SECRET=<64-karakter-random-secret>

# Container Registry (lokal build için)
REGISTRY=ecosfer
IMAGE_PREFIX=skdm
TAG=latest

# CORS
CORS_ALLOWED_ORIGINS=http://localhost

# Email (opsiyonel - boş bırakılabilir)
RESEND_API_KEY=

# AI Service (opsiyonel - template fallback kullanır)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<24-karakter-random-şifre>
```

NOT: PowerShell ile random şifre üretmek için:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]]) | Select-Object -First 1
```
veya Node.js ile:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ADIM 2: Windows Uyumlu docker-compose.prod.yml Güncelle

`docker-compose.prod.yml` dosyasında Windows uyumluluk düzeltmeleri yap:

### 2a. node-exporter servisini kaldır veya devre dışı bırak
Windows'ta `/proc`, `/sys`, `/rootfs` mount'ları çalışmaz. `node-exporter` servisini tamamen sil veya comment-out yap.

### 2b. promtail volume mount'larını güncelle
Windows Docker Desktop'ta container log yolu farklıdır. promtail servisindeki volume'ları güncelle:

```yaml
  promtail:
    image: grafana/promtail:3.4.2
    container_name: ecosfer-promtail
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./docker/promtail/promtail-config.yml:/etc/promtail/config.yml:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: "0.25"
```

### 2c. Prometheus config'den node-exporter job'unu kaldır
`docker/prometheus/prometheus.yml` dosyasında `node` job'unu comment-out yap:

```yaml
  # Node exporter - DISABLED on Windows
  # - job_name: "node"
  #   static_configs:
  #     - targets: ["node-exporter:9100"]
```

### 2d. Nginx'i SSL'siz localhost moduna al
`docker/nginx/nginx.prod.conf` dosyasını localhost için SSL olmadan çalışacak şekilde güncelle. HTTPS server bloğunu HTTP olarak değiştir:

Mevcut nginx.prod.conf'u yedekle (`nginx.prod.conf.bak`), sonra aşağıdaki nginx localhost konfigürasyonunu yaz:

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format json_combined escape=json
        '{"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"request_method":"$request_method",'
        '"request_uri":"$request_uri",'
        '"status":$status,'
        '"body_bytes_sent":$body_bytes_sent,'
        '"request_time":$request_time,'
        '"upstream_response_time":"$upstream_response_time",'
        '"http_user_agent":"$http_user_agent",'
        '"http_referer":"$http_referer"}';

    access_log /var/log/nginx/access.log json_combined;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    upstream frontend {
        server frontend:3000;
    }

    upstream dotnet_api {
        server dotnet:5100;
    }

    upstream ai_api {
        server ai:8000;
    }

    upstream grafana {
        server grafana:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Health check
        location /nginx-health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Nginx status for monitoring
        location /nginx-status {
            stub_status on;
            access_log off;
            allow 172.16.0.0/12;
            allow 10.0.0.0/8;
            allow 127.0.0.1;
            deny all;
        }

        # Grafana
        location /grafana/ {
            proxy_pass http://grafana;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # .NET Document Service API (frontend proxy ile erişiyor)
        location /api/documents/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://dotnet_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 120s;
        }

        # Python AI Service API (frontend proxy ile erişiyor)
        location /api/ai/ {
            limit_req zone=api burst=5 nodelay;
            proxy_pass http://ai_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 120s;
        }

        # Auth rate limiting
        location /api/auth/ {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Next.js Frontend (catch-all)
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### 2e. Nginx SSL volume mount'unu kaldır
`docker-compose.prod.yml` içindeki nginx servisinden SSL volume'larını kaldır:

Mevcut:
```yaml
    volumes:
      - ./docker/nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
      - ./certbot/www:/var/www/certbot:ro
```

Yeni:
```yaml
    volumes:
      - ./docker/nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
```

---

## ADIM 3: Promtail Config'ini Docker Socket İçin Güncelle

`docker/promtail/promtail-config.yml` dosyasını Docker API ile log okuyacak şekilde güncelle:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
      - source_labels: ['__meta_docker_container_name']
        regex: '/ecosfer-(.*)'
        target_label: 'service'
    pipeline_stages:
      - docker: {}
      - match:
          selector: '{container=~"ecosfer-(frontend|dotnet|ai)"}'
          stages:
            - json:
                expressions:
                  level: level
                  msg: msg
                  service: service
            - labels:
                level:
                service:
```

---

## ADIM 4: Docker Image'ları Build Et ve Container'ları Başlat

```powershell
cd C:\Users\90544\Desktop\Ecosfer.SKDM.Panel\ecosfer-skdm-v2

# Tüm image'ları build et ve container'ları başlat
docker compose -f docker-compose.prod.yml up --build -d
```

Bu işlem ilk seferde 10-15 dakika sürebilir (image indirme + build). İlerlemeyi takip etmek için:

```powershell
docker compose -f docker-compose.prod.yml logs -f
```

Tüm container'ların durumunu kontrol et:

```powershell
docker compose -f docker-compose.prod.yml ps
```

Beklenen sonuç: db, redis, frontend, dotnet, ai, nginx, prometheus, grafana, loki, promtail container'ları "running" veya "healthy" durumunda olmalı.

---

## ADIM 5: Database Migration ve Seed

Container'lar ayağa kalktıktan sonra DB şema ve seed çalıştır:

```powershell
# Frontend container içinde Prisma migrate deploy çalıştır
docker exec -it ecosfer-frontend npx prisma migrate deploy

# Eğer migrate dosyaları yoksa (db push kullanılıyorsa):
docker exec -it ecosfer-frontend npx prisma db push

# Seed data yükle (39 ülke, 30 şehir, 26 ilçe, 60+ CN kodu, birimler, roller, admin kullanıcı)
docker exec -it ecosfer-frontend npx tsx prisma/seed.ts
```

NOT: Seed başarılı olursa "[12/12] Seed completed" mesajı görünecek. Admin giriş bilgileri:
- Email: `admin@ecosfer.com`
- Şifre: `Admin123!`

---

## ADIM 6: Health Check ve Doğrulama

Her servisi tek tek kontrol et:

```powershell
# Frontend
curl http://localhost/api/health

# Nginx
curl http://localhost/nginx-health

# .NET Service (docker network içinden)
docker exec ecosfer-nginx wget -qO- http://dotnet:5100/health

# AI Service (docker network içinden)
docker exec ecosfer-nginx wget -qO- http://ai:8000/health

# Prometheus
curl http://localhost:9090/-/ready

# Grafana
curl http://localhost:3001/grafana/api/health

# Loki
curl http://localhost:3100/ready
```

Tarayıcıda kontrol:
- **Frontend:** http://localhost (login sayfası görünmeli)
- **Grafana:** http://localhost:3001/grafana/ (admin / .env'deki şifre)
- **Prometheus:** http://localhost:9090 (targets sayfasında tüm job'lar UP olmalı)

---

## ADIM 7: Sorun Giderme

### Container başlamıyorsa:
```powershell
docker compose -f docker-compose.prod.yml logs <servis-adi>
# Örnek: docker compose -f docker-compose.prod.yml logs frontend
```

### DB bağlantı hatası:
```powershell
# DB container'ının healthy olduğunu kontrol et
docker inspect ecosfer-db --format='{{.State.Health.Status}}'

# DB'ye bağlan
docker exec -it ecosfer-db psql -U ecosfer -d ecosfer_skdm
```

### Frontend build hatası:
```powershell
# Build log'larına bak
docker compose -f docker-compose.prod.yml build frontend --no-cache
```

### Tüm container'ları sıfırla (dikkatli ol - veri kaybı):
```powershell
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up --build -d
```

---

## ADIM 8: Başarılı Deploy Sonrası

Deploy başarılı olduktan sonra:
1. http://localhost adresinden `admin@ecosfer.com` / `Admin123!` ile giriş yap
2. Dashboard'da stat kartlarının yüklendiğini kontrol et
3. Şirketler/Tesisler/Beyannameler sayfalarını gez
4. Grafana'da (http://localhost:3001/grafana/) dashboard'ları kontrol et
5. `Admin123!` şifresini değiştir

---

## ÖZET: Hızlı Komut Listesi

```powershell
# 1. Docker doğrulama
docker --version && docker compose version

# 2. .env oluştur (ADIM 1'deki şablon)

# 3. Config güncellemeleri (ADIM 2-3)

# 4. Build ve deploy
cd C:\Users\90544\Desktop\Ecosfer.SKDM.Panel\ecosfer-skdm-v2
docker compose -f docker-compose.prod.yml up --build -d

# 5. DB setup
docker exec -it ecosfer-frontend npx prisma db push
docker exec -it ecosfer-frontend npx tsx prisma/seed.ts

# 6. Doğrula
docker compose -f docker-compose.prod.yml ps
curl http://localhost/api/health
```
