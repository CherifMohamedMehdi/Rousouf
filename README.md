# Roufouf — the civic knowledge archive

Roufouf (Arabic: *رفوف*, "shelves") is a public, multilingual archive for
Tunisian civil-society research: reports, policy briefs, studies, and data
notes produced by NGOs, think-tanks, and independent researchers. The goal
is to make ~10,000 scattered documents discoverable in one place, preserve
them, and make them easy to cite.

This repository is the **frontend** (Next.js 14, App Router, TypeScript,
Tailwind) and the **operational spec** of the backend (Directus schema and
admin workflows). The actual Directus instance, PostgreSQL database, and
Meilisearch server run separately on a VPS.

---

## 1. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + `next-intl` | SSR/ISR, great RTL story, easy i18n |
| CMS / API | Directus on PostgreSQL | Open source, clean REST/GraphQL, batteries-included admin |
| Search | Meilisearch | Self-hostable, fast, decent Arabic support out of the box |
| Storage | Directus built-in (S3-compatible) | One less moving part |
| Hosting | Frontend on Vercel, everything else on one VPS | Keeps infra and bills minimal |

See `docs/SCHEMA.md` for the complete data model,
`docs/ADMIN_GUIDE.md` for editorial workflows, and
`docs/ZENODO.md` for optional Zenodo storage, sync API, and environment variables.

---

## 2. Quick start (mocks-only)

The frontend runs standalone against bundled mock data, so you don't need to
install Directus to develop against it.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000 and you'll land on the Arabic homepage. Use the
language toggle in the header to switch to French or English. All pages
(search, document detail, submit, about, donate, organization profiles) are
wired and driven by mocks in `mocks/*.ts`.

**Why mocks?** We wanted the frontend team to ship without waiting on the
backend. The `lib/directus/*` data access layer auto-detects whether
`DIRECTUS_URL` is set and transparently routes calls to either mocks or the
real SDK — no code changes required when you point it at a live Directus.

---

## 3. Wiring up a real Directus

### Local with Docker (recommended first)

1. Start from the repo root and run `pnpm try`.
2. This command brings up Postgres + Directus + Meilisearch (`docker compose up -d`), runs `scripts/seed.ts`, then starts Next.js dev.
3. Open:
   - Public site: `http://localhost:3000`
   - Directus admin: `http://localhost:8055` (default: `admin@example.com` / `roufouf-dev`)
4. The seed script prints `DIRECTUS_TOKEN`; paste it into `.env.local` if needed and restart `pnpm dev`.

### Production on a VPS

1. Install Directus + PostgreSQL on the VPS (see `docs/SCHEMA.md §Setup recipe`). Enable the `pg_trgm` extension.
2. Apply collections, fields, and permissions from `docs/SCHEMA.md` (UI or schema snapshot CLI).
3. Set `DIRECTUS_URL` and `DIRECTUS_TOKEN` in the frontend environment and restart.
4. (Optional) Install Meilisearch and set `MEILISEARCH_HOST` / `MEILISEARCH_KEY`; fallback search still works when unset.

---

## 4. Environment variables

Every variable is documented inline in `.env.example`. A quick reference:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DIRECTUS_URL` | *(empty → mocks)* | Base URL of the CMS. |
| `DIRECTUS_TOKEN` | *(empty)* | Static admin token for server-side reads. |
| `MEILISEARCH_HOST` | *(empty → mock)* | Meilisearch instance URL. |
| `MEILISEARCH_KEY` | *(empty)* | API key for the `documents` index. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical URL for OpenGraph, sitemap, citations. |
| `DUPLICATE_SIMILARITY_THRESHOLD` | `0.85` | Fuzzy-match threshold for duplicate detection. |
| `MAX_UPLOAD_MB` | `50` | Per-file size cap for submissions. |
| `MAX_BULK_FILES` | `20` | Max files in a bulk submission. |
| `PAYMENT_PROVIDER` | `disabled` | `disabled` / `stripe` / `paymee` / `konnect`. |
| `RATE_LIMIT_WINDOW_SEC` | `60` | Rate-limit window for public writes. |
| `RATE_LIMIT_MAX` | `10` | Requests per window per IP. |
| `NEXT_PUBLIC_ANALYTICS_DOMAIN` | *(empty)* | If set with `_SRC`, loads privacy-respecting analytics. |
| `NOTIFICATIONS_ENABLED` | `false` | Fallback master switch (overridden by Directus Ops Settings). |
| `NOTIFY_CONTACT_ENABLED` | `true` | Fallback contact notification switch. |
| `NOTIFY_SUGGESTIONS_ENABLED` | `true` | Fallback suggest-edit notification switch. |
| `NOTIFY_SUBMISSIONS_ENABLED` | `true` | Fallback submission notification switch. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | *(empty)* | SMTP transport for notifications. |
| `NOTIFY_FROM_EMAIL` / `NOTIFY_TO_EMAIL` | *(empty)* | Sender + fallback recipient(s), comma-separated allowed. |
| `BACKUP_ENABLED` | `false` | Fallback toggle for backup worker. |
| `BACKUP_POLL_SECONDS` | `300` | Worker poll cadence for checking admin settings. |
| `BACKUP_INTERVAL_HOURS` | `24` | Fallback backup cadence (admin-editable in UI). |
| `BACKUP_RETENTION_DAYS` | `30` | Fallback local retention (admin-editable in UI). |
| `BACKUP_S3_ENABLED` | `false` | Fallback off-site copy toggle. |
| `BACKUP_S3_BUCKET` / `BACKUP_S3_PREFIX` | *(empty)* / `roufouf` | S3 destination for off-site backups. |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_DEFAULT_REGION` | *(empty)* | Credentials/region for S3 upload. |

---

## 5. Deploying

### Frontend — Vercel

1. Import the repo in Vercel.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `pnpm build`. Install command: `pnpm install`.
4. Add all `NEXT_PUBLIC_*` and server-side envs from the table above.
5. Assign the production domain (e.g. `roufouf.tn`) and set
   `NEXT_PUBLIC_SITE_URL` accordingly.

### Backend — VPS

1. Provision a small VPS (2 vCPU / 4 GB RAM is plenty to start). Install
   Docker + docker-compose.
2. Use the Directus + Postgres + Meilisearch compose stack in
   `docs/SCHEMA.md §Setup recipe` as a starting point.
3. Put Caddy or nginx in front for TLS. Sub-domains we use:
   - `cms.roufouf.tn` → Directus admin + API
   - `search.roufouf.tn` → Meilisearch
4. Enable backup worker (`BACKUP_ENABLED=true`) so Docker generates scheduled
   Postgres dumps + Directus uploads archives to local backup volume.
5. (Recommended) set S3 envs and `BACKUP_S3_ENABLED=true` for off-site copies.

### Notifications and backups

- Public write endpoints send alert emails for contact/suggestions/submissions.
- Runtime toggles and recipients are managed in Directus **Ops Settings** singleton:
  - `notifications_enabled`, per-flow switches, `notify_to_emails`
  - `backup_enabled`, `backup_interval_hours`, `backup_retention_days_local`,
    `backup_s3_enabled`, `backup_s3_prefix`, optional `backup_pause_until`
- Docker compose includes a `backup` service that:
  - reads Ops Settings from Directus on each poll,
  - runs scheduled backups and logs each run in `backup_jobs`,
  - supports admin-triggered one-off runs via `backup_requests`,
  - writes local artifacts to `backup_data` volume at `/backups/local/{postgres,uploads}`,
  - optionally uploads artifacts to S3-compatible storage.

### Secrets vs admin-editable settings

- **Keep in env only (secrets):**
  - SMTP credentials, S3 credentials, DB credentials.
- **Editable by admins in Directus UI:**
  - notification toggles and recipients,
  - backup toggle/frequency/retention/pause,
  - manual backup requests and backup history review.

Restore quick path:
1. Pick a `backup_jobs` row marked `success` and copy its artifact paths.
2. Restore DB dump with `gunzip -c <file.sql.gz> | psql ...`.
3. Restore uploads with `tar -xzf <uploads.tar.gz> -C <directus uploads dir>`.
4. Restart Directus.
5. Follow the full drill + validation checklist in `docs/RESTORE_DRILL.md`.

---

## 6. Architecture at a glance

```
+--------------------+   reads/writes   +------------------+
|   Next.js (Vercel) | <--------------> | Directus (VPS)   |
|  /[locale]/...     |     REST API     |  PostgreSQL      |
+----------+---------+                  +--------+---------+
           |                                     |
           | search                              | indexes via Flow
           v                                     v
    +-------------+                       +-----------+
    | Meilisearch |                       | pg_trgm   |
    |   (VPS)     |                       | (dup det.)|
    +-------------+                       +-----------+
```

Client-side extras:
- `pdfjs-dist` extracts text from uploaded PDFs in the browser (no bytes
  leave the device until the user confirms the submission).
- Web Crypto SHA-256 produces the hash used for exact-duplicate detection.
- A normalized first-2k-words fingerprint feeds the fuzzy duplicate check
  via `pg_trgm` on the backend.

---

## 7. Repository layout

```
app/
  [locale]/                — all public pages, locale-scoped
    page.tsx               — homepage
    search/page.tsx        — search + browse
    documents/[id]/        — document detail
    organizations/[slug]/  — organization profiles
    submit/                — user submissions
    about/                 — mission, team, contact form
    donate/                — donation page
    feed.atom/route.ts     — global Atom feed
  api/
    suggestions/           — edit suggestions
    submissions/           — new document submissions
    duplicate-check/       — hash + fingerprint lookup
    contact/               — contact form
    donors/highlights/     — privacy-safe donor wall
    donate/intent/         — donation intents
components/                — small, single-purpose React components
lib/
  directus/                — data access (mock-or-real, per collection)
  i18n/                    — locale config + taxonomy helpers
  search/                  — Meilisearch client + URL param helpers
  citations/               — APA / Chicago / MLA / BibTeX / RIS generators
  pdf/                     — extract / hash / fingerprint / detect
  feeds/                   — Atom feed builder
  payments/                — provider-agnostic payment seam
  seo/                     — metadata helpers + JSON-LD
mocks/                     — typed sample data for every collection
messages/                  — ar / fr / en message catalogs
types/directus.ts          — TypeScript interfaces mirroring the schema
docs/
  SCHEMA.md                — full Directus spec + ER diagram + setup
  ADMIN_GUIDE.md           — plain-language editor/moderator manual
```

---

## 8. How to extend

Most common requests land in one of the patterns below.

### 8.1 Add a new filter (taxonomy)

Search facets are now metadata-driven:

1. **Create metadata field(s)** on `documents` (e.g. `funder`, `funders`, `sector`).
2. **Populate data** in Directus rows (or in `mocks/documents.ts` while in mock mode).
3. **(Optional) add facet definition rows** in `search_facets` to control labels/order.
4. Reload `/[locale]/search` — the sidebar discovers new fields automatically and
   renders them as filter boxes with in-filter search.

No frontend code changes are required for simple categorical facets.

### 8.2 Change donation presets

Edit them in Directus admin: **Donation Tiers**. No code deploy required.

### 8.3 Turn on a real payment provider

1. Implement `lib/payments/<provider>.ts` against the
   `PaymentProvider` interface in `lib/payments/provider.ts` (there's a
   working `disabled.ts` example).
2. Register it in `lib/payments/index.ts`'s selector switch.
3. Flip `PAYMENT_PROVIDER` in `.env.local` / Vercel env.
4. Existing donation-lead data stays untouched; new flows will go through
   the provider instead.

### 8.4 Plug in analytics

Set `NEXT_PUBLIC_ANALYTICS_DOMAIN` and `NEXT_PUBLIC_ANALYTICS_SRC` to any
privacy-respecting script (Plausible, Umami, …). The `Analytics` component
in the layout only loads the script when both envs are present.

### 8.5 Add a new language

1. Add the locale code to `lib/i18n/config.ts` (`locales`, `dir`).
2. Copy `messages/en.json` to `messages/<locale>.json` and translate.
3. Add `name_<locale>` fields to each taxonomy collection in Directus and
   update `lib/i18n/taxonomy.ts`'s `pickLabel` fallback chain.
4. Optional: add a new font variable in `app/[locale]/layout.tsx` if the
   script needs it.

---

## 9. Quality + accessibility

- WCAG 2.1 AA targeted: semantic landmarks, skip link, focus-visible rings
  driven by the brand gold, `aria-*` on interactive widgets, color
  contrast checked against the palette in `tailwind.config.ts`.
- RTL-first: all directional utilities use logical properties
  (`ps-*` / `pe-*` / `start-*` / `end-*`) or Tailwind's `rtl:` variant.
- SEO: per-route `generateMetadata`, OpenGraph + Twitter cards,
  `schema.org` JSON-LD (ScholarlyArticle on documents, Organization on
  org profiles), sitemap, robots, Atom feeds (global / per-theme /
  per-org).
- Abuse protection: every public write endpoint has honeypot + IP-based
  rate limiting; rate limit is pluggable with Upstash when deploying
  behind a serverless edge.
- Privacy: analytics is opt-in and cookieless; donor names only appear on
  the public wall when the donor explicitly opts in.

---

## 10. Scripts

```bash
pnpm dev          # start the dev server (Next.js)
pnpm build        # production build
pnpm start        # serve the production build
pnpm lint         # eslint across the codebase
pnpm typecheck    # tsc --noEmit
pnpm check:writes # regression check for public write flows (contact/suggestions/submissions)
```

---

## 11. License & credits

Code: MIT (see `LICENSE` if added).
Content in the archive: each document keeps its original license; metadata
is CC-BY 4.0 unless otherwise noted.

Built by the Roufouf team. ♥

---

## 12. Operations docs

- `docs/ADMIN_GUIDE.md` — no-code editorial + ops procedures in Directus.
- `docs/RESTORE_DRILL.md` — executed backup restore rehearsal and verification.
- `docs/OPERATIONS_RUNBOOK.md` — monitoring, alert handling, incident response.
- `docs/LAUNCH_CHECKLIST.md` — pre-launch, launch-day, and post-launch checklist.
