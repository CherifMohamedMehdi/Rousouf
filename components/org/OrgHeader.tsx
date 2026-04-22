/**
 * OrgHeader — top block of the organization profile page.
 *
 * Shows the logo, localized name, VerifiedBadge when applicable, and the
 * organization's description. Kept separate from the contact panel so the
 * page can render the identity row edge-to-edge while the contact block
 * sits in the sidebar with its own suggest-edit controls.
 */
import type { Locale } from '@/lib/i18n/config';
import { pickLocalizedName } from '@/lib/i18n/taxonomy';
import type { Organization } from '@/types/directus';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

interface Props {
  org: Organization;
  locale: Locale;
}

export default function OrgHeader({ org, locale }: Props) {
  const orgName = pickLocalizedName(org, locale) || org.name;

  return (
    <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:gap-6">
      {org.logo?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={org.logo.url}
          alt={orgName}
          className="h-16 w-16 rounded-lg border border-border bg-white object-contain p-1"
        />
      ) : null}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold text-brand-blue md:text-4xl">{orgName}</h1>
          {org.is_verified ? <VerifiedBadge /> : null}
        </div>
        {org.description ? (
          <p className="mt-2 max-w-3xl text-base text-brand-ink-soft">{org.description}</p>
        ) : null}
      </div>
    </header>
  );
}
