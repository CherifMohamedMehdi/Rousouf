# Backup Restore Drill

This document captures the staging-style restore rehearsal for Roufouf v1.

## Drill Objective

Validate that we can recover:
- PostgreSQL content from a generated `.sql.gz` backup
- Directus uploaded files from a generated `.tar.gz` archive

## Artifacts Used

- DB dump: `/backups/local/postgres/roufouf-db-20260424T133331Z.sql.gz`
- Uploads archive: `/backups/local/uploads/directus-uploads-20260424T133331Z.tar.gz`
- Source job record: `backup_jobs.id = 2` (status `success`, triggered by `admin`)

## Procedure Executed

1. Triggered backup through admin flow:
   - Updated `ops_settings.backup_enabled = true`
   - Inserted `backup_requests` item with `status = pending`
   - Verified worker moved request to `completed`
2. Verified backup files exist in backup volume.
3. Restored DB dump into scratch database `roufouf_restore_drill`.
4. Ran validation queries (`documents` count and `submissions` count).
5. Extracted uploads archive into temporary folder and verified file count.

## Verification Results

- `backup_jobs` contains successful run with DB and uploads paths.
- `backup_requests` request moved from `pending` to `completed`.
- Scratch DB restore completed without errors.
- Validation query results after restore:
  - `documents_count = 8`
  - `submissions_count = 0`
- Upload archive extraction succeeded, restored file count: `2`.

## Restore Checklist (Operational)

Use this checklist during a real incident:

1. Choose a `backup_jobs` row with `status = success`.
2. Restore DB:
   - `gunzip -c <db_backup_path> | psql -U <user> -d <target_db>`
3. Restore uploads:
   - `tar -xzf <uploads_backup_path> -C <directus_uploads_dir>`
4. Restart Directus service.
5. Validate:
   - Documents list loads in admin
   - Public document pages render
   - Attached files download successfully
   - Suggestions/submissions collections are accessible

## Frequency Recommendation

- Run this restore drill at least once per quarter.
- Repeat after any backup script or storage backend change.
