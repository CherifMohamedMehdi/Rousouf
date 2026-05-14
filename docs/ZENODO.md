# Zenodo integration

This document describes how Roufouf can use **Zenodo** as the public file host and DOI source while **Directus** remains the editorial catalogue. The authoritative field list lives in [`SCHEMA.md`](SCHEMA.md); editor-facing steps are summarized in [`ADMIN_GUIDE.md`](ADMIN_GUIDE.md).

## Goals

- Publish approved PDFs to Zenodo from server-side code using the [Zenodo REST API](https://developers.zenodo.org/).
- Store the minted **DOI**, **record URL**, and per-file **Zenodo file URLs** on the `documents` row (and in each `files[]` slot where applicable).
- Let the public site resolve **viewer and download URLs** from either Zenodo or Directus via a single **ops** switch.

## Directus fields

### `ops_settings` (singleton)

| Field | Values | Role |
| --- | --- | --- |
| `public_pdf_source` | `zenodo` \| `directus` | When `zenodo`, the Next.js app prefers `zenodo_file_url` on each file slot for iframe/download. When `directus`, URLs come from Directus files only. The Zenodo sync job treats `directus` as a **pause** for writes (status `paused`). |

New installs seed `public_pdf_source` to `directus` until you deliberately switch to `zenodo`.

### `documents`

Zenodo identifiers and sync state: `zenodo_doi`, `zenodo_record_id`, `zenodo_concept_recid`, `zenodo_record_url`, `zenodo_deposition_id`, `zenodo_sync_status`, `zenodo_synced_at`, `zenodo_metadata_synced_at`, `zenodo_metadata_hash`, `zenodo_sync_error`. Several of these are read-only in the Directus UI after `scripts/seed.ts` field hints run.

### `documents.files[]` (JSON array)

Per slot, optional: `zenodo_file_url`, `zenodo_file_key`, `zenodo_file_checksum` (filled after a successful sync).

## Environment variables

See [`.env.example`](../.env.example). Summary:

| Variable | Purpose |
| --- | --- |
| `ZENODO_ACCESS_TOKEN` | Personal access token with `deposit:write` and `deposit:actions` (server only; never expose to the browser). |
| `ZENODO_API_BASE_URL` | Default `https://zenodo.org/api`; use `https://sandbox.zenodo.org/api` for testing. |
| `ZENODO_WEB_BASE_URL` | Web origin for constructed record/file URLs; inferred from `ZENODO_API_BASE_URL` when omitted. |
| `ZENODO_COMMUNITY` | Optional community identifier for `metadata.communities`. |
| `ZENODO_DEFAULT_LICENSE` | Default license id (e.g. `cc-by-4.0`). |
| `PUBLIC_PDF_SOURCE` | Fallback when `ops_settings` cannot be read; defaults to `directus`. |
| `DIRECTUS_ADMIN_TOKEN` | Recommended so the app can read `ops_settings` (including `public_pdf_source`) without widening the public token’s field permissions. |

## Sync API (Next.js)

**Endpoint:** `POST /api/admin/sync-zenodo`

**Authentication:** Same as branding webhooks: header `x-branding-secret: <secret>` or `Authorization: Bearer <secret>`, where `<secret>` is `BRANDING_WEBHOOK_SECRET` or the value stored in Directus **Ops Settings → Branding webhook secret**.

**Body (JSON):**

```json
{ "documentId": "<uuid of documents row>" }
```

**Responses:** JSON with `ok`, `action` (`paused` \| `created` \| `metadata_updated` \| `unchanged` \| `failed`), `documentId`, optional `doi` or `error`.

Typical wiring: a Directus **Flow** (or cron hitting your deployed site) that calls this URL after an editor publishes or updates metadata, using the same secret pattern as `/api/admin/publish-branding`.

## Code map

| Area | Path |
| --- | --- |
| Zenodo HTTP client | `apps/web/lib/zenodo/client.ts` |
| Metadata mapping + hash | `apps/web/lib/zenodo/metadata.ts` |
| Sync orchestration | `apps/web/lib/zenodo/sync.ts` |
| Route handler | `apps/web/app/api/admin/sync-zenodo/route.ts` |
| Public PDF resolution | `apps/web/lib/pdf/resolvePublicPdfFile.ts` |
| Ops settings (includes `public_pdf_source`) | `apps/web/lib/directus/opsSettings.ts` |
| Schema seed / field hints | `apps/web/scripts/seed.ts` |

## Behaviour notes

- **Previews:** The document page uses an `<iframe>` when the resolved URL is embeddable (direct PDF URL). If only a record landing URL is available, the UI shows an external **View on Zenodo** link instead.
- **Citations:** When `zenodo_doi` is set, APA/Chicago/MLA/BibTeX/RIS prefer `https://doi.org/...` where appropriate (see `apps/web/lib/citations/url.ts`).
- **JSON-LD:** Report schema includes `identifier` (DOI) and `sameAs` (Zenodo record URL) when present (`apps/web/lib/seo/jsonLd.ts`).

## Existing Directus databases

If the instance was created before these fields existed, run **`pnpm seed`** (or add the fields manually to match `docs/SCHEMA.md`) so collections and UI hints stay aligned.

## References

- [Zenodo REST API](https://developers.zenodo.org/)
- [Zenodo Sandbox](https://sandbox.zenodo.org/)
