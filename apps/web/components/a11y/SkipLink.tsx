/**
 * Skip-to-content link.
 *
 * Rendered first inside <body>. Screen-reader and keyboard users reveal it
 * by tabbing; it jumps focus to the page's <main id="main">. See
 * app/globals.css for the visual treatment.
 */
'use client';

import { useTranslations } from 'next-intl';

export default function SkipLink() {
  const t = useTranslations('nav');
  return (
    <a href="#main" className="skip-link">
      {t('skipToContent')}
    </a>
  );
}
