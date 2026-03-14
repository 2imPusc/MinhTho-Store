#!/bin/bash
# MongoDB Atlas backup script
# Usage: ./scripts/backup.sh
# Requires: mongodump (part of MongoDB Database Tools)
# Download: https://www.mongodb.com/try/download/database-tools

# Load env vars from server/.env
if [ -f "$(dirname "$0")/../server/.env" ]; then
  export $(grep -v '^#' "$(dirname "$0")/../server/.env" | xargs)
fi

if [ -z "$MONGO_URI" ]; then
  echo "Error: MONGO_URI not set. Check server/.env"
  exit 1
fi

BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

mkdir -p "$BACKUP_PATH"

echo "Starting backup..."
echo "Output: $BACKUP_PATH"

mongodump --uri="$MONGO_URI" --out="$BACKUP_PATH"

if [ $? -eq 0 ]; then
  echo "Backup completed: $BACKUP_PATH"
  echo ""
  echo "To restore, run:"
  echo "  mongorestore --uri=\"\$MONGO_URI\" --drop $BACKUP_PATH"
else
  echo "Backup failed!"
  exit 1
fi
