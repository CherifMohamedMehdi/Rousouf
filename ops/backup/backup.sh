#!/usr/bin/env sh
set -eu

DIRECTUS_URL="${DIRECTUS_URL:-http://directus:8055}"
DIRECTUS_ADMIN_EMAIL="${DIRECTUS_ADMIN_EMAIL:-admin@example.com}"
DIRECTUS_ADMIN_PASSWORD="${DIRECTUS_ADMIN_PASSWORD:-roufouf-dev}"
LOCAL_ROOT="${BACKUP_LOCAL_DIR:-/backups/local}"
DB_DIR="$LOCAL_ROOT/postgres"
UPLOADS_DIR="$LOCAL_ROOT/uploads"
mkdir -p "$DB_DIR" "$UPLOADS_DIR"

api_call() {
  method="$1"
  path="$2"
  body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS -X "$method" "$DIRECTUS_URL$path" \
      --globoff \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -sS -X "$method" "$DIRECTUS_URL$path" \
      --globoff \
      -H "Authorization: Bearer $DIRECTUS_TOKEN"
  fi
}

login() {
  DIRECTUS_TOKEN="$(
    curl -sS -X POST "$DIRECTUS_URL/auth/login" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$DIRECTUS_ADMIN_EMAIL\",\"password\":\"$DIRECTUS_ADMIN_PASSWORD\"}" \
      | jq -r '.data.access_token // empty'
  )"
  if [ -z "$DIRECTUS_TOKEN" ]; then
    echo "[backup] failed to obtain Directus token"
    exit 1
  fi
}

latest_job_started_at() {
  api_call GET '/items/backup_jobs?fields=id,started_at&filter[status][_eq]=success&sort=-id&limit=1' \
    | jq -r '.data | if type=="array" then .[0].started_at else "" end // ""'
}

now_epoch() {
  date -u +%s
}

iso_to_epoch() {
  python3 - "$1" <<'PY'
import datetime, sys
raw = sys.argv[1].replace('Z', '+00:00')
print(int(datetime.datetime.fromisoformat(raw).timestamp()))
PY
}

load_settings() {
  RAW_SETTINGS="$(api_call GET '/items/ops_settings?fields=*&limit=1')"
  SETTINGS_ROW="$(echo "$RAW_SETTINGS" | jq -c '.data | if type=="array" then .[0] else . end // {}')"
  BACKUP_ENABLED="$(echo "$SETTINGS_ROW" | jq -r '.backup_enabled // false')"
  BACKUP_INTERVAL_HOURS="$(echo "$SETTINGS_ROW" | jq -r '.backup_interval_hours // 24')"
  BACKUP_RETENTION_DAYS="$(echo "$SETTINGS_ROW" | jq -r '.backup_retention_days_local // 30')"
  BACKUP_S3_ENABLED_SETTING="$(echo "$SETTINGS_ROW" | jq -r '.backup_s3_enabled // false')"
  BACKUP_S3_PREFIX_SETTING="$(echo "$SETTINGS_ROW" | jq -r '.backup_s3_prefix // "roufouf"')"
  BACKUP_PAUSE_UNTIL="$(echo "$SETTINGS_ROW" | jq -r '.backup_pause_until // ""')"
}

claim_pending_request() {
  local pending
  pending="$(api_call GET '/items/backup_requests?fields=id,requested_by&filter[status][_eq]=pending&sort=id&limit=1' | jq -c '.data[0] // null')"
  if [ "$pending" = "null" ]; then
    FORCE_RUN="false"
    REQUEST_ID=""
    REQUESTED_BY="scheduler"
    return
  fi
  REQUEST_ID="$(echo "$pending" | jq -r '.id')"
  REQUESTED_BY="$(echo "$pending" | jq -r '.requested_by // "admin"')"
  FORCE_RUN="true"
  api_call PATCH "/items/backup_requests/$REQUEST_ID" '{"status":"processing"}' >/dev/null
}

should_run_by_schedule() {
  if [ "$FORCE_RUN" = "true" ]; then
    return 0
  fi
  if [ "$BACKUP_ENABLED" != "true" ]; then
    return 1
  fi
  if [ -n "$BACKUP_PAUSE_UNTIL" ] && [ "$BACKUP_PAUSE_UNTIL" != "null" ]; then
    PAUSE_EPOCH="$(iso_to_epoch "$BACKUP_PAUSE_UNTIL")"
    NOW_EPOCH="$(now_epoch)"
    if [ "$NOW_EPOCH" -lt "$PAUSE_EPOCH" ]; then
      return 1
    fi
  fi
  LAST_STARTED="$(latest_job_started_at)"
  if [ -z "$LAST_STARTED" ]; then
    return 0
  fi
  LAST_EPOCH="$(iso_to_epoch "$LAST_STARTED")"
  NOW_EPOCH="$(now_epoch)"
  INTERVAL_SECONDS="$((BACKUP_INTERVAL_HOURS * 3600))"
  DIFF="$((NOW_EPOCH - LAST_EPOCH))"
  [ "$DIFF" -ge "$INTERVAL_SECONDS" ]
}

mark_request() {
  status="$1"
  if [ -n "$REQUEST_ID" ]; then
    api_call PATCH "/items/backup_requests/$REQUEST_ID" "{\"status\":\"$status\"}" >/dev/null
  fi
}

login
load_settings
claim_pending_request
if ! should_run_by_schedule; then
  echo "[backup] skip (disabled or interval not reached)"
  exit 0
fi

TS="$(date -u +%Y%m%dT%H%M%SZ)"
JOB_START="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DB_FILE="$DB_DIR/roufouf-db-$TS.sql.gz"
UPLOADS_FILE="$UPLOADS_DIR/directus-uploads-$TS.tar.gz"
S3_ENABLED="${BACKUP_S3_ENABLED:-$BACKUP_S3_ENABLED_SETTING}"
S3_PREFIX="${BACKUP_S3_PREFIX:-$BACKUP_S3_PREFIX_SETTING}"

echo "[backup] creating postgres dump -> $DB_FILE"
if ! PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST:-db}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" | gzip > "$DB_FILE"; then
  mark_request failed
  api_call POST '/items/backup_jobs' "{\"started_at\":\"$JOB_START\",\"finished_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"status\":\"failed\",\"error\":\"pg_dump failed\",\"triggered_by\":\"$REQUESTED_BY\"}" >/dev/null
  exit 1
fi

if [ -d "${DIRECTUS_UPLOADS_DIR:-/directus/uploads}" ]; then
  echo "[backup] archiving uploads -> $UPLOADS_FILE"
  tar -czf "$UPLOADS_FILE" -C "${DIRECTUS_UPLOADS_DIR:-/directus/uploads}" .
else
  echo "[backup] uploads dir missing; skipping archive"
fi

echo "[backup] pruning local files older than ${BACKUP_RETENTION_DAYS} days"
find "$DB_DIR" -type f -mtime "+$BACKUP_RETENTION_DAYS" -delete
find "$UPLOADS_DIR" -type f -mtime "+$BACKUP_RETENTION_DAYS" -delete

if [ "$S3_ENABLED" = "true" ] && [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  PREFIX="$S3_PREFIX"
  echo "[backup] uploading to s3://${BACKUP_S3_BUCKET}/${PREFIX}/"
  aws s3 cp "$DB_FILE" "s3://${BACKUP_S3_BUCKET}/${PREFIX}/postgres/$(basename "$DB_FILE")"
  if [ -f "$UPLOADS_FILE" ]; then
    aws s3 cp "$UPLOADS_FILE" "s3://${BACKUP_S3_BUCKET}/${PREFIX}/uploads/$(basename "$UPLOADS_FILE")"
  fi
fi

TARGETS='["local"]'
if [ "$S3_ENABLED" = "true" ] && [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  TARGETS='["local","s3"]'
fi
api_call POST '/items/backup_jobs' "{\"started_at\":\"$JOB_START\",\"finished_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"status\":\"success\",\"db_backup_path\":\"$DB_FILE\",\"uploads_backup_path\":\"$UPLOADS_FILE\",\"storage_targets\":$TARGETS,\"triggered_by\":\"$REQUESTED_BY\"}" >/dev/null
mark_request completed

echo "[backup] done at $TS"
