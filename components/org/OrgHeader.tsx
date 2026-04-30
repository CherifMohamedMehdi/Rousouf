/**
 * OrgHeader — top block of the organization profile page.
 *
 * Shows the logo, localized name, VerifiedBadge when applicable, and the
 * organization's localized description with the same suggest-edit affordance
 * as document abstracts.
 */
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import InlineFieldSuggestHeading from '@/components/documents/InlineFieldSuggestHeading';
import { pickLocalizedDescription, pickLocalizedName, suggestableOrganizationDescriptionField } from '@/lib/i18n/taxonomy';
import type { Organization } from '@/types/directus';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

interface Props {
  org: Organization;
  locale: Locale;
}

export default async function OrgHeader({ org, locale }: Props) {
  const orgName = pickLocalizedName(org, locale) || org.name;
  const description = pickLocalizedDescription(org, locale);
  const descSuggest = suggestableOrganizationDescriptionField(org, locale);
  const tOrg = await getTranslations('organization');

  return (
    <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:gap-6">
      {org.logo?.url ? (
        <img
          src={org.logo.url}
          alt={orgName}
          className="h-16 w-16 rounded-lg border border-border bg-white object-contain p-1"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold text-brand-blue md:text-4xl">{orgName}</h1>
          {org.is_verified ? <VerifiedBadge /> : null}
        </div>
        <section className="mt-3 max-w-3xl" aria-labelledby="org-description-heading">
          <h2 id="org-description-heading" className="sr-only">
            {tOrg('description')}
          </h2>
          <InlineFieldSuggestHeading
            label={tOrg('description')}
            targetType="organization"
            targetId={org.id}
            fieldName={descSuggest.fieldName}
            fieldLabel={tOrg('description')}
            currentValue={descSuggest.currentValue}
          />
          <p className={`text-base leading-relaxed ${description ? 'text-brand-ink-soft' : 'italic text-brand-ink-soft/80'}`}>
            {description || '—'}
          </p>
        </section>
      </div>
    </header>
  );
}
