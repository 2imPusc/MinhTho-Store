#!/usr/bin/env bash
# Restore MongoDB từ archive. Dùng khi cần khôi phục.
# Usage: bash restore.sh /var/backups/mongo/minhtho-20260414-020000.gz
#        bash restore.sh gdrive:minhtho-backups/minhtho-20260414-020000.gz

set -euo pipefail

ARCHIVE="${1:?Cần đường dẫn archive (local hoặc rclone remote)}"
DB_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/minhtho}"
DB_NAME="${DB_NAME:-minhtho}"

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

if [[ "$ARCHIVE" == *:* ]]; then
    echo "==> Tải archive từ cloud"
    rclone copy "$ARCHIVE" "$TMP_DIR"
    ARCHIVE="$TMP_DIR/$(basename "$ARCHIVE")"
fi

echo "==> Restore $ARCHIVE → $DB_NAME (dùng --drop để thay thế collections hiện có)"
read -rp "Tiếp tục? [yes/N] " confirm
[[ "$confirm" == "yes" ]] || { echo "Huỷ"; exit 1; }

mongorestore --uri="$DB_URI" --archive="$ARCHIVE" --gzip --drop --nsInclude="${DB_NAME}.*"
echo "==> Restore xong"
