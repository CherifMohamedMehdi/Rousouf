# Launch Checklist (V1, No Payments)

## Pre-Launch (T-7 to T-1)

- [ ] `pnpm typecheck` passes on main.
- [ ] `pnpm build` passes on main.
- [ ] `pnpm check:writes` passes.
- [ ] Directus `ops_settings` configured:
  - [ ] notifications enabled as intended
  - [ ] recipient list verified
  - [ ] backup schedule + retention verified
- [ ] At least one successful `backup_jobs` run in the last 24h.
- [ ] Restore drill completed and documented in `docs/RESTORE_DRILL.md`.
- [ ] CI workflows enabled:
  - [ ] `.github/workflows/ci.yml`
  - [ ] `.github/workflows/uptime-check.yml`
- [ ] GitHub secrets configured for uptime checks.
- [ ] Admin team reviewed `docs/ADMIN_GUIDE.md`.

## Launch Day

- [ ] Confirm health endpoints return 200:
  - [ ] public site
  - [ ] directus `/server/health`
- [ ] Smoke-test key journeys:
  - [ ] browse search results
  - [ ] view document detail
  - [ ] submit correction suggestion
  - [ ] submit contact form
  - [ ] submit document
- [ ] Verify one notification arrives for a test submission.
- [ ] Verify `backup_requests` -> `backup_jobs` flow with one manual run.
- [ ] Publish launch comms.

## Post-Launch (First 72h)

- [ ] Review uptime-check workflow runs every 30 minutes.
- [ ] Review Directus and backup logs at least twice daily.
- [ ] Keep moderation queue under SLA:
  - [ ] suggestions older than 72h = 0
  - [ ] submissions older than 7 days = 0
- [ ] Capture user feedback/issues in triage board.
- [ ] Publish v1 post-launch retro with top 3 fixes.
