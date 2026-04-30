/**
 * Regenerates the locale prefix segment in `middleware.ts` from `lib/i18n/config.ts`.
 * Turbopack requires matchers to be string literals in that file (no template literals),
 * but this script keeps them aligned with `locales` on every `pnpm build` (via prebuild).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { locales } from '../lib/i18n/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mwPath = path.join(__dirname, '..', 'middleware.ts');

const MARKER_START = '    // <next-intl-locale-matcher>';
const MARKER_END = '    // </next-intl-locale-matcher>';

const inner = [...locales].join('|');
const matcherLine = `    '/(${inner})(/.*)?',`;

let source = fs.readFileSync(mwPath, 'utf8');
const startIdx = source.indexOf(MARKER_START);
const endIdx = source.indexOf(MARKER_END);

if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
  throw new Error(
    `[sync-middleware-matcher] middleware.ts must contain markers:\n${MARKER_START}\n...\n${MARKER_END}`,
  );
}

const block = `${MARKER_START}\n${matcherLine}\n${MARKER_END}`;
const next = `${source.slice(0, startIdx)}${block}${source.slice(endIdx + MARKER_END.length)}`;

if (next !== source) {
  fs.writeFileSync(mwPath, next);
  console.log(`[sync-middleware-matcher] updated middleware locale matcher → /(${inner})(/.*)?`);
}
