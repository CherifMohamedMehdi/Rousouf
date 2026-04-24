# Operations Runbook

This runbook defines baseline monitoring, alert handling, and incident response for Roufouf v1.

## Monitoring Baseline

### Automated checks

- GitHub Actions workflow: `.github/workflows/uptime-check.yml`
  - Runs every 30 minutes.
  - Checks:
    - `SITE_HEALTH_URL` (public site endpoint)
    - `DIRECTUS_HEALTH_URL` (e.g. `/server/health`)
  - On failure, optionally posts to `ALERT_WEBHOOK_URL`.

### Runtime signals

- Backup worker logs (`docker compose logs backup`)
- Directus API health (`/server/health`)
- Next.js app availability (homepage and key locale pages)

## Required Secrets (GitHub)

- `SITE_HEALTH_URL`
- `DIRECTUS_HEALTH_URL`
- `ALERT_WEBHOOK_URL` (optional but recommended)

## Incident Severity

- **P1**: Site unavailable, Directus unavailable, backup failures for >24h.
- **P2**: Notification delivery failing, single endpoint degraded.
- **P3**: Non-critical UX issues with available workaround.

## On-Call Response

1. Acknowledge alert within 15 minutes.
2. Confirm blast radius:
   - Public site?
   - Directus admin/API?
   - Backup worker?
3. Capture first evidence:
   - `docker compose ps`
   - `docker compose logs --tail 200 directus`
   - `docker compose logs --tail 200 backup`
4. Mitigate:
   - Restart unhealthy service.
   - If data risk exists, freeze write operations and verify last successful backup job.
5. Communicate status in team channel every 30 minutes until resolved.

## Recovery Verification

- Public site pages load for `ar`, `fr`, `en`.
- Directus admin login works.
- Recent `backup_jobs` entry has `status=success`.
- Contact/suggestion/submission API routes return expected status codes.

## Rollback Decision

Use rollback when:
- New deploy causes sustained P1/P2 for >30 minutes.
- No low-risk hotfix is available.

Rollback steps:
1. Deploy previous stable image/commit.
2. Re-run health checks.
3. Record incident summary and root cause.

## Post-Incident Template

- Start time / end time
- Impacted surfaces
- Root cause
- Immediate mitigation
- Preventive actions
- Owner + deadline per action
