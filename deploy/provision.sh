#!/bin/bash
set -e

# ScreenFlow DigitalOcean Provisioning Script
# Idempotent setup for Ubuntu 24.04

# 1. Update and install dependencies
apt-get update
apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    python3-dev \
    build-essential \
    tesseract-ocr \
    nginx \
    postgresql \
    postgresql-contrib \
    libpq-dev \
    redis-server \
    certbot \
    python3-certbot-nginx \
    git \
    ufw

# 2. Create non-root user
if ! id "screenflow" &>/dev/null; then
    adduser --system --group --no-create-home screenflow
fi

# 3. Setup application directory
mkdir -p /opt/screenflow
chown -R screenflow:screenflow /opt/screenflow

# Note: You should clone the repository into /opt/screenflow manually
# e.g., git clone <your-repo> /opt/screenflow
# and then run this script again or continue manually.

# Ensure correct permissions
if [ -d "/opt/screenflow" ]; then
    chown -R screenflow:screenflow /opt/screenflow
fi

# 4. Postgres setup
# Wait for postgres to start
systemctl enable postgresql
systemctl start postgresql

sudo -u postgres psql -c "CREATE DATABASE screenflow;" || true
sudo -u postgres psql -c "CREATE USER screenflow WITH ENCRYPTED PASSWORD 'screenflow_db_pass';" || true
sudo -u postgres psql -c "ALTER ROLE screenflow SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE screenflow SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE screenflow SET timezone TO 'UTC';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE screenflow TO screenflow;"

# Allow the new user to create the schema (public schema changes in PG 15+)
sudo -u postgres psql -d screenflow -c "GRANT ALL ON SCHEMA public TO screenflow;" || true

# 5. Redis setup
# Ensure redis is only bound to localhost for security
sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf
systemctl enable redis-server
systemctl restart redis-server

# 6. Firewall rules
ufw allow OpenSSH
ufw allow 'Nginx Full' # allows 80 and 443
ufw --force enable

echo "System provisioned successfully."
echo "Local DATABASE_URL: postgresql://screenflow:screenflow_db_pass@localhost/screenflow"
echo "Local REDIS_URL: redis://localhost:6379/0"
