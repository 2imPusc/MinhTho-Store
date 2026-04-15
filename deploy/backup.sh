#!/usr/bin/env bash
# Backup MongoDB → local → upload cloud qua rclone.
# Chạy qua cron mỗi đêm. Giữ 7 ngày local + 30 ngày cloud.
#
# Cấu hình rclone trước:
#   rclone config  → tạo remote tên "gdrive" (Google Drive) hoặc "r2" (Cloudflare R2)
# Sau đó set env RCLONE_REMOTE="gdrive:minhtho-backups" hoặc tương tự.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/mongo}"
DB_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/minhtho}"
DB_NAME="${DB_NAME:-minhtho}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive:minhtho-backups}"
LOCAL_RETENTION_DAYS="${LOCAL_RETENTION_DAYS:-7}"
CLOUD_RETENTION_DAYS="${CLOUD_RETENTION_DAYS:-30}"

STAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE="$BACKUP_DIR/minhtho-$STAMP.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Bắt đầu backup → $ARCHIVE"
mongodump --uri="$DB_URI" --db="$DB_NAME" --archive="$ARCHIVE" --gzip --quiet

SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo "[$(date -Iseconds)] Archive xong ($SIZE)"

# Upload cloud
if command -v rclone >/dev/null 2>&1; then
    echo "[$(date -Iseconds)] Upload → $RCLONE_REMOTE"
    rclone copy "$ARCHIVE" "$RCLONE_REMOTE" --quiet
else
    echo "[$(date -Iseconds)] rclone chưa cài → bỏ qua upload cloud" >&2
fi

# Dọn local > N ngày
find "$BACKUP_DIR" -name "minhtho-*.gz" -mtime +"$LOCAL_RETENTION_DAYS" -delete

# Dọn cloud > N ngày
if command -v rclone >/dev/null 2>&1; then
    rclone delete "$RCLONE_REMOTE" --min-age "${CLOUD_RETENTION_DAYS}d" --quiet || true
fi

echo "[$(date -Iseconds)] Backup hoàn tất"
