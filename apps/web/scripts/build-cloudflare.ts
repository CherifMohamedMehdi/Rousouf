/**
 * Cloudflare/OpenNext build entrypoint.
 *
 * Wrangler's bundler can otherwise choose browser/default package exports for
 * some dependencies, which has shown up in Workers as `undefined.default` at
 * request time. Force Node-compatible resolution before OpenNext bundles.
 */
import { spawnSync } from 'node:child_process';

import './sync-middleware-matcher';

const result = spawnSync('pnpm', ['exec', 'opennextjs-cloudflare', 'build'], {
  env: {
    ...process.env,
    WRANGLER_BUILD_CONDITIONS: '',
    WRANGLER_BUILD_PLATFORM: 'node',
  },
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
