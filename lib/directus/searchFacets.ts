import { getTranslations } from 'next-intl/server';
import { isMockMode } from './client';
import { getDocuments } from './documents';
import { getDocumentTypes, getGovernorates, getLanguages, getThemes } from './taxonomies';
import { getOrganizations } from './organizations';
import type { Locale } from '@/lib/i18n/config';
import { pickLabel, pickLocalizedName } from '@/lib/i18n/taxonomy';
import { inferDynamicFacetsFromDocuments, type SearchFacet } from '@/lib/search/facets';
import type { SearchFacetDefinition } from '@/types/directus';

export async function getSearchFacets(locale: Locale): Promise<SearchFacet[]> {
  const [themes, types, organizations, governorates, languages, t] = await Promise.all([
    getThemes(),
    getDocumentTypes(),
    getOrganizations(),
    getGovernorates(),
    getLanguages(),
    getTranslations({ locale, namespace: 'search.filters' }),
  ]);

  const coreFacets: SearchFacet[] = [
    {
      key: 'themes',
      paramKey: 'themes',
      label: t('themes'),
      sourceField: 'themes',
      options: themes.map((x) => ({ value: x.slug, label: pickLabel(x, locale) })),
    },
    {
      key: 'types',
      paramKey: 'types',
      label: t('documentTypes'),
      sourceField: 'document_type',
      options: types.map((x) => ({ value: x.slug, label: pickLabel(x, locale) })),
    },
    {
      key: 'organizations',
      paramKey: 'orgs',
      label: t('organizations'),
      sourceField: 'organization',
      options: organizations.map((x) => ({ value: x.slug, label: pickLocalizedName(x, locale) })),
    },
    {
      key: 'governorates',
      paramKey: 'governorates',
      label: t('governorates'),
      sourceField: 'governorates',
      options: governorates.map((x) => ({ value: x.slug, label: pickLabel(x, locale) })),
    },
    {
      key: 'languages',
      paramKey: 'languages',
      label: t('languages'),
      sourceField: 'language',
      options: languages.map((x) => ({ value: x.slug, label: pickLabel(x, locale) })),
    },
  ];

  if (!isMockMode()) {
    try {
      const token = process.env.DIRECTUS_TOKEN;
      const res = await fetch(`${process.env.DIRECTUS_URL}/items/search_facets`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
        next: { revalidate: 60 },
      });
      const response = (res.ok ? await res.json() : { data: [] }) as { data?: SearchFacetDefinition[] };
      const defs = (response.data ?? [])
        .filter((x) => x.is_active)
        .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
      if (defs.length) {
        return defs.map((def) => {
          const hit = coreFacets.find((item) => item.sourceField === def.source_field || item.paramKey === def.query_param);
          return {
            key: def.key,
            paramKey: def.query_param,
            sourceField: def.source_field,
            label:
              (locale === 'ar' ? def.label_ar : locale === 'fr' ? def.label_fr : def.label_en) ||
              hit?.label ||
              def.key,
            options: hit?.options ?? [],
          };
        });
      }
    } catch {
      // fall back to core+inferred facets if collection is absent
    }
  }

  // Dynamic facet discovery enables zero-code filters for future metadata fields.
  const docs = (await getDocuments({ limit: 10000, status: 'published' })).items;
  const dynamic = inferDynamicFacetsFromDocuments(docs, locale)
    .filter((facet) => !coreFacets.some((core) => core.sourceField === facet.sourceField || core.paramKey === facet.paramKey));

  return [...coreFacets, ...dynamic];
}

