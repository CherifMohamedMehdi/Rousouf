# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- **Translated PDF suggestions**: Visitors on a published document page can
  submit a translated PDF via **Suggest a translated PDF** (next to Files).
  `POST /api/translation-suggestions` uploads the file to Directus, creates a
  `translation_suggestions` row for editorial review, and reuses the same
  email notification channel as metadata suggestions (`notify_suggestions_enabled`).
  Directus collection `translation_suggestions` is defined in `docs/SCHEMA.md`
  and created by `scripts/seed.ts` (re-seed or migrate existing stacks).
- **Language taxonomy**: Pre-seeded `languages` now include Spanish (`es`),
  Italian (`it`), German (`de`), Turkish (`tr`), Portuguese (`pt`), Russian
  (`ru`), Chinese (`zh`), and **Other** last—after Arabic, French, and English.
  Mocks in `mocks/taxonomies.ts` match `docs/SCHEMA.md` §4.4.

### Notes

- PDF language auto-detection in `lib/pdf/detect.ts` remains `ar | fr | en |
  other`; new language slugs are selected manually in contribute and translation
  flows unless detection is extended later.
