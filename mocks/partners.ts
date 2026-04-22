/**
 * Mock partners — institutional supporters displayed on the homepage strip.
 *
 * Shapes match docs/SCHEMA.md §7.1. Logos use placeholder SVGs in /public.
 */
import type { Partner } from '@/types/directus';

export const mockPartners: Partner[] = [
  {
    id: 'p-osf',
    name: 'Open Society Foundation',
    logo: { id: 'logo-osf', url: '/partners/osf.svg' },
    website: 'https://example.org/osf',
    tier: 'strategic',
    sort_order: 1,
    is_active: true,
    display_on_homepage: true,
  },
  {
    id: 'p-ned',
    name: 'National Endowment for Democracy',
    logo: { id: 'logo-ned', url: '/partners/ned.svg' },
    website: 'https://example.org/ned',
    tier: 'strategic',
    sort_order: 2,
    is_active: true,
    display_on_homepage: true,
  },
  {
    id: 'p-hivos',
    name: 'Hivos',
    logo: { id: 'logo-hivos', url: '/partners/hivos.svg' },
    website: 'https://example.org/hivos',
    tier: 'strategic',
    sort_order: 3,
    is_active: true,
    display_on_homepage: true,
  },
  {
    id: 'p-euro',
    name: 'EuroMed Rights',
    logo: { id: 'logo-euro', url: '/partners/euromed.svg' },
    website: 'https://example.org/euromed',
    tier: 'supporting',
    sort_order: 4,
    is_active: true,
    display_on_homepage: true,
  },
  {
    id: 'p-heinrich',
    name: 'Heinrich Böll Stiftung',
    logo: { id: 'logo-heinrich', url: '/partners/heinrich.svg' },
    website: 'https://example.org/heinrich',
    tier: 'supporting',
    sort_order: 5,
    is_active: true,
    display_on_homepage: true,
  },
  {
    id: 'p-rsf',
    name: 'Reporters Without Borders',
    logo: { id: 'logo-rsf', url: '/partners/rsf.svg' },
    website: 'https://example.org/rsf',
    tier: 'media',
    sort_order: 6,
    is_active: true,
    display_on_homepage: true,
  },
  {
    id: 'p-ifm',
    name: 'Institut Français des Médias',
    logo: { id: 'logo-ifm', url: '/partners/ifm.svg' },
    website: 'https://example.org/ifm',
    tier: 'media',
    sort_order: 7,
    is_active: true,
    display_on_homepage: true,
  },
];
