#!/usr/bin/env bash
# Cài cron backup: hàng đêm 2h sáng.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/minhtho}"
CRON_LINE="0 2 * * * /usr/bin/env bash $APP_DIR/deploy/backup.sh >> /var/log/minhtho-backup.log 2>&1"

# Đảm bảo file log có quyền ghi
sudo touch /var/log/minhtho-backup.log
sudo chown "$USER":"$USER" /var/log/minhtho-backup.log

# Thêm cron nếu chưa có
( crontab -l 2>/dev/null | grep -v "minhtho/deploy/backup.sh" ; echo "$CRON_LINE" ) | crontab -

echo "Đã cài cron:"
crontab -l | grep backup.sh
echo "Log: /var/log/minhtho-backup.log"
echo "Test ngay: bash $APP_DIR/deploy/backup.sh"
