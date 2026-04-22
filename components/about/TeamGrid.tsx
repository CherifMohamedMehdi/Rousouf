/**
 * TeamGrid — responsive grid of team member cards.
 *
 * Localized role + bio come straight from the `team_members` collection.
 * Photos are optional; a neutral placeholder square renders when absent.
 */
import type { TeamMember } from '@/types/directus';
import type { Locale } from '@/lib/i18n/config';
import { Linkedin } from 'lucide-react';

interface Props {
  members: TeamMember[];
  locale: Locale;
}

export default function TeamGrid({ members, locale }: Props) {
  if (!members.length) return null;
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => {
        const role = m[`role_${locale}` as const] ?? m.role_en ?? '';
        const bio = m[`bio_${locale}` as const] ?? m.bio_en ?? '';
        return (
          <li key={m.id} className="rounded-xl border border-border bg-white p-5">
            <div className="flex items-center gap-4">
              {m.photo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.photo.url}
                  alt={m.name}
                  className="h-14 w-14 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-brand-blue-soft" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-semibold text-brand-blue">{m.name}</p>
                <p className="text-xs text-brand-ink-soft">{role}</p>
              </div>
            </div>
            {bio ? <p className="mt-3 text-sm text-brand-ink-soft">{bio}</p> : null}
            {m.linkedin_url ? (
              <a
                href={m.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${m.name} on LinkedIn`}
                className="mt-3 inline-flex items-center gap-1 text-xs text-brand-blue hover:text-brand-blue-dark"
              >
                <Linkedin size={12} aria-hidden="true" /> LinkedIn
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
