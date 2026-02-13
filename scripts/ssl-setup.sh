#!/bin/bash
# SSL Certificate Setup with Let's Encrypt (certbot)
# Usage: ./scripts/ssl-setup.sh <domain> [email]
# Example: ./scripts/ssl-setup.sh cbam.ecosfer.com admin@ecosfer.com

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-admin@ecosfer.com}"
NGINX_CONTAINER="ecosfer-nginx"
CERT_DIR="./docker/nginx/ssl"

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain> [email]"
    echo "Example: $0 cbam.ecosfer.com admin@ecosfer.com"
    exit 1
fi

echo "=== SSL Certificate Setup for $DOMAIN ==="

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y certbot
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot
    else
        echo "ERROR: Please install certbot manually"
        exit 1
    fi
fi

# Create cert directory
mkdir -p "$CERT_DIR"
mkdir -p /var/www/certbot

# Obtain certificate
echo "Obtaining SSL certificate..."
sudo certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --domain "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --force-renewal

# Copy certificates to nginx ssl directory
echo "Copying certificates..."
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_DIR/fullchain.pem"
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CERT_DIR/privkey.pem"
sudo chmod 644 "$CERT_DIR/fullchain.pem"
sudo chmod 600 "$CERT_DIR/privkey.pem"

# Reload nginx
if docker ps --format '{{.Names}}' | grep -q "$NGINX_CONTAINER"; then
    echo "Reloading nginx..."
    docker exec "$NGINX_CONTAINER" nginx -s reload
    echo "Nginx reloaded successfully"
else
    echo "WARNING: Nginx container not running. Start it with docker-compose."
fi

echo "=== SSL setup complete for $DOMAIN ==="

# Setup auto-renewal cron job
echo ""
echo "To setup auto-renewal, add this to crontab (crontab -e):"
echo "0 3 * * * certbot renew --quiet --post-hook \"cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERT_DIR/fullchain.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERT_DIR/privkey.pem && docker exec $NGINX_CONTAINER nginx -s reload\""
