/**
 * Next.js configuration.
 *
 * What this does:
 * - Wires next-intl into the build via its plugin, so our `i18n/request.ts`
 *   module is picked up for server components.
 * - Allows remote images from the Directus instance so organization/partner
 *   logos and PDF page thumbnails can render via <Image />.
 *
 * How to edit:
 * - To add a new Directus host (staging, prod), extend `remotePatterns` below.
 * - To enable experimental features, add them under `experimental`.
 */
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
