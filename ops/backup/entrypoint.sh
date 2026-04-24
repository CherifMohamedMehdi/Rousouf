#!/usr/bin/env sh
set -eu

POLL_SECONDS="${BACKUP_POLL_SECONDS:-300}"

echo "[backup] scheduler started (poll=${POLL_SECONDS}s)"
while true; do
  sed 's/\r$//' /opt/backup/backup.sh | sh || true
  sleep "$POLL_SECONDS"
done
