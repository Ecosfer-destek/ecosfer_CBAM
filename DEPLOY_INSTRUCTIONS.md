# Ecosfer SKDM v2.0 - Production Deploy Talimatlari

> Bu dosyadaki adimlari sirayla uygula. Her adimi tamamladiktan sonra bir sonrakine gec.
> Hedef: Windows 11 + Docker Desktop ile tum 11 servisi ayaga kaldir.

---

## ONKOŞUL: Docker Desktop Dogrulama

Docker Desktop'in kurulu ve calisiyor oldugunu dogrula:

```powershell
docker --version
docker compose version
```

Her iki komut da basariyla calisiyorsa devam et. Calismiyorsa Docker Desktop uygulamasini ac ve WSL2 backend'inin aktif oldugunu kontrol et.

---

## ADIM 1: Production .env Dosyasi Olustur

`ecosfer-skdm-v2/.env` dosyasini asagidaki icerikle olustur. Sifreleri guclu random degerlerle doldur (openssl rand -hex 24 veya benzeri ile uret):

```env
# Database
DB_USER=ecosfer
DB_PASSWORD=<32-karakter-random-sifre>
DB_NAME=ecosfer_skdm

# Redis
REDIS_PASSWORD=<24-karakter-random-sifre>

# NextAuth (localhost icin)
NEXTAUTH_URL=http://localhost
NEXTAUTH_SECRET=<64-karakter-random-secret>

# Container Registry (lokal build icin)
REGISTRY=ecosfer
IMAGE_PREFIX=skdm
TAG=latest

# CORS
CORS_ALLOWED_ORIGINS=http://localhost

# Email (opsiyonel - bos birakilabilir)
RESEND_API_KEY=

# AI Service (opsiyonel - template fallback kullanir)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<24-karakter-random-sifre>
```

NOT: PowerShell ile random sifre uretmek icin:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]]) | Select-Object -First 1
```
veya Node.js ile:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ADIM 2: Windows Uyumlu docker-compose.prod.yml Guncelle

`docker-compose.prod.yml` dosyasinda Windows uyumluluk duzeltmeleri yap:

### 2a. node-exporter servisini kaldir veya devre disi birak
Windows'ta `/proc`, `/sys`, `/rootfs` mount'lari calismaz. `node-exporter` servisini tamamen sil veya comment-out yap.

### 2b. promtail volume mount'larini guncelle
Windows Docker Desktop'ta container log yolu farklidir. promtail servisindeki volume'lari guncelle:

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

### 2c. Prometheus config'den node-exporter job'unu kaldir
`docker/prometheus/prometheus.yml` dosyasinda `node` job'unu comment-out yap:

```yaml
  # Node exporter - DISABLED on Windows
  # - job_name: "node"
  #   static_configs:
  #     - targets: ["node-exporter:9100"]
```

### 2d. Nginx'i SSL'siz localhost moduna al
`docker/nginx/nginx.prod.conf` dosyasini localhost icin SSL olmadan calisacak sekilde guncelle. HTTPS server blogunu HTTP olarak degistir:

Mevcut nginx.prod.conf'u yedekle (`nginx.prod.conf.bak`), sonra asagidaki nginx localhost konfigurasyonunu yaz:

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

        # .NET Document Service API (frontend proxy ile erisiyor)
        location /api/documents/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://dotnet_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 120s;
        }

        # Python AI Service API (frontend proxy ile erisiyor)
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

### 2e. Nginx SSL volume mount'unu kaldir
`docker-compose.prod.yml` icindeki nginx servisinden SSL volume'larini kaldir:

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

## ADIM 3: Promtail Config'ini Docker Socket Icin Guncelle

`docker/promtail/promtail-config.yml` dosyasini Docker API ile log okuyacak sekilde guncelle:

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

## ADIM 4: Docker Image'lari Build Et ve Container'lari Baslat

```powershell
cd C:\Users\90544\Desktop\Ecosfer.SKDM.Panel\ecosfer-skdm-v2

# Tum image'lari build et ve container'lari baslat
docker compose -f docker-compose.prod.yml up --build -d
```

Bu islem ilk seferde 10-15 dakika surebilir (image indirme + build). Ilerlemeyi takip etmek icin:

```powershell
docker compose -f docker-compose.prod.yml logs -f
```

Tum container'larin durumunu kontrol et:

```powershell
docker compose -f docker-compose.prod.yml ps
```

Beklenen sonuc: db, redis, frontend, dotnet, ai, nginx, prometheus, grafana, loki, promtail container'lari "running" veya "healthy" durumunda olmali.

---

## ADIM 5: Database Migration ve Seed

Container'lar ayaga kalktiktan sonra DB sema ve seed calistir:

```powershell
# Frontend container icinde Prisma migrate deploy calistir
docker exec -it ecosfer-frontend npx prisma migrate deploy

# Eger migrate dosyalari yoksa (db push kullaniliyorsa):
docker exec -it ecosfer-frontend npx prisma db push

# Seed data yukle (39 ulke, 30 sehir, 26 ilce, 60+ CN kodu, birimler, roller, admin kullanici)
docker exec -it ecosfer-frontend npx tsx prisma/seed.ts
```

NOT: Seed basarili olursa "[12/12] Seed completed" mesaji gorunecek. Admin giris bilgileri:
- Email: `admin@ecosfer.com`
- Sifre: `Admin123!`

---

## ADIM 6: Health Check ve Dogrulama

Her servisi tek tek kontrol et:

```powershell
# Frontend
curl http://localhost/api/health

# Nginx
curl http://localhost/nginx-health

# .NET Service (docker network icinden)
docker exec ecosfer-nginx wget -qO- http://dotnet:5100/health

# AI Service (docker network icinden)
docker exec ecosfer-nginx wget -qO- http://ai:8000/health

# Prometheus
curl http://localhost:9090/-/ready

# Grafana
curl http://localhost:3001/grafana/api/health

# Loki
curl http://localhost:3100/ready
```

Tarayicida kontrol:
- **Frontend:** http://localhost (login sayfasi gorunmeli)
- **Grafana:** http://localhost:3001/grafana/ (admin / .env'deki sifre)
- **Prometheus:** http://localhost:9090 (targets sayfasinda tum job'lar UP olmali)

---

## ADIM 7: Sorun Giderme

### Container baslamiyorsa:
```powershell
docker compose -f docker-compose.prod.yml logs <servis-adi>
# Ornek: docker compose -f docker-compose.prod.yml logs frontend
```

### DB baglanti hatasi:
```powershell
# DB container'inin healthy oldugunu kontrol et
docker inspect ecosfer-db --format='{{.State.Health.Status}}'

# DB'ye baglan
docker exec -it ecosfer-db psql -U ecosfer -d ecosfer_skdm
```

### Frontend build hatasi:
```powershell
# Build log'larina bak
docker compose -f docker-compose.prod.yml build frontend --no-cache
```

### Tum container'lari sifirla (dikkatli ol - veri kaybi):
```powershell
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up --build -d
```

---

## ADIM 8: Basarili Deploy Sonrasi

Deploy basarili olduktan sonra:
1. http://localhost adresinden `admin@ecosfer.com` / `Admin123!` ile giris yap
2. Dashboard'da stat kartlarinin yuklendigini kontrol et
3. Sirketler/Tesisler/Beyannameler sayfalarini gez
4. Grafana'da (http://localhost:3001/grafana/) dashboard'lari kontrol et
5. `Admin123!` sifresini degistir

---

## OZET: Hizli Komut Listesi

```powershell
# 1. Docker dogrulama
docker --version && docker compose version

# 2. .env olustur (ADIM 1'deki sablon)

# 3. Config guncellemeleri (ADIM 2-3)

# 4. Build ve deploy
cd C:\Users\90544\Desktop\Ecosfer.SKDM.Panel\ecosfer-skdm-v2
docker compose -f docker-compose.prod.yml up --build -d

# 5. DB setup
docker exec -it ecosfer-frontend npx prisma db push
docker exec -it ecosfer-frontend npx tsx prisma/seed.ts

# 6. Dogrula
docker compose -f docker-compose.prod.yml ps
curl http://localhost/api/health
```
