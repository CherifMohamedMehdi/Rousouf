/**
 * Root layout.
 *
 * This file intentionally does very little: the middleware redirects every
 * public path to /<locale>, and the locale-scoped layout in
 * app/[locale]/layout.tsx is what sets <html lang>, <html dir>, and the
 * nav/footer. We keep a minimal root layout here because Next.js requires
 * one at the top of the app directory.
 */
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Roufouf — The civic knowledge archive',
    template: '%s · Roufouf',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
