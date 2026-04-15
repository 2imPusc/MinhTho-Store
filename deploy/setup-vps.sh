#!/usr/bin/env bash
# Cài đặt server Ubuntu 22.04 LTS cho MinhTho Store.
# Chạy với user có sudo (khuyên tạo user 'deploy' thay vì root):
#   curl -fsSL https://raw.githubusercontent.com/<your-repo>/main/deploy/setup-vps.sh | bash
# Hoặc scp file lên rồi: bash setup-vps.sh

set -euo pipefail

DOMAIN="${DOMAIN:-store.example.com}"
APP_DIR="${APP_DIR:-/opt/minhtho}"
NODE_VERSION="${NODE_VERSION:-20}"
MONGO_VERSION="${MONGO_VERSION:-7.0}"

echo "==> Cập nhật hệ thống"
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget gnupg ca-certificates lsb-release ufw git build-essential

echo "==> Firewall UFW (mở 22, 80, 443)"
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "==> Cài Node.js $NODE_VERSION"
curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

echo "==> Cài MongoDB $MONGO_VERSION"
curl -fsSL "https://pgp.mongodb.com/server-${MONGO_VERSION}.asc" | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-${MONGO_VERSION}.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-${MONGO_VERSION}.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/${MONGO_VERSION} multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-${MONGO_VERSION}.list
sudo apt-get update -y
sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod

echo "==> Cài Nginx + Certbot"
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "==> Cài rclone (backup cloud)"
curl -fsSL https://rclone.org/install.sh | sudo bash

echo "==> Tạo thư mục app"
sudo mkdir -p "$APP_DIR" /var/backups/mongo
sudo chown -R "$USER":"$USER" "$APP_DIR" /var/backups/mongo

echo "==> Hoàn tất. Bước tiếp theo:"
echo "  1. Clone repo vào $APP_DIR: git clone <repo> $APP_DIR"
echo "  2. Cài deps: cd $APP_DIR/server && npm ci --omit=dev"
echo "  3. Build FE: cd $APP_DIR/client && npm ci && npm run build"
echo "  4. Tạo $APP_DIR/server/.env (xem .env.example)"
echo "  5. Start PM2: pm2 start $APP_DIR/deploy/ecosystem.config.cjs && pm2 save && pm2 startup"
echo "  6. Cấu hình Nginx: sudo cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/minhtho"
echo "     sudo ln -s /etc/nginx/sites-available/minhtho /etc/nginx/sites-enabled/"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo "  7. HTTPS: sudo certbot --nginx -d $DOMAIN"
echo "  8. Backup cron: bash $APP_DIR/deploy/install-backup-cron.sh"
