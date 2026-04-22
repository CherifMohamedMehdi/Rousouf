/**
 * ShareButtons — lightweight social share row for a document page.
 *
 * Uses the platforms' public share endpoints (no SDKs, no tracking
 * scripts) so we stay privacy-respecting by default. Every link opens in
 * a new tab with rel="noopener noreferrer".
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Linkedin, Twitter, Facebook, MessageCircle, Link2 } from 'lucide-react';

interface Props {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: Props) {
  const t = useTranslations('document.share');
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      key: 'twitter',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: Twitter,
    },
    {
      key: 'linkedin',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      Icon: Linkedin,
    },
    {
      key: 'facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: Facebook,
    },
    {
      key: 'whatsapp',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      Icon: MessageCircle,
    },
  ] as const;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignored
    }
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-ink-soft">
        {t('heading')}
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {links.map(({ key, href, Icon }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(key)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-brand-ink-soft hover:border-brand-blue hover:text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
          >
            <Icon size={16} aria-hidden="true" />
          </a>
        ))}
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? t('linkCopied') : t('copyLink')}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-sm font-medium text-brand-ink-soft hover:border-brand-blue hover:text-brand-blue"
        >
          <Link2 size={14} aria-hidden="true" />
          {copied ? t('linkCopied') : t('copyLink')}
        </button>
      </div>
    </div>
  );
}
