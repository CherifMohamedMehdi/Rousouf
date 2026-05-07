import { defaultBrandingPalette, type BrandingPalette, type BrandingPresentation } from '@/lib/branding/defaults';
import type { DirectusFile } from '@/types/directus';
import { isMockMode } from './client';
import { parseDirectusFileField } from './catalog';
import { directusGetSingleton } from './http';

type BrandingSettingsRow = Record<string, unknown>;

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/u.test(value.trim());
}

function pickColor(value: unknown, fallback: string): string {
  return isHexColor(value) ? value.trim() : fallback;
}

function parsePalette(row: BrandingSettingsRow): BrandingPalette {
  return {
    primary: pickColor(row.published_primary_color, defaultBrandingPalette.primary),
    secondary: pickColor(row.published_secondary_color, defaultBrandingPalette.secondary),
    background: pickColor(row.published_background_color, defaultBrandingPalette.background),
    text: pickColor(row.published_text_color, defaultBrandingPalette.text),
    border: pickColor(row.published_border_color, defaultBrandingPalette.border),
  };
}

function parsePublishedLogo(row: BrandingSettingsRow): DirectusFile | null {
  return parseDirectusFileField(row.published_logo) ?? null;
}

export async function getBrandingPresentation(): Promise<BrandingPresentation> {
  if (isMockMode()) {
    return {
      logo: null,
      palette: defaultBrandingPalette,
    };
  }
  try {
    const row = await directusGetSingleton<BrandingSettingsRow>('branding_settings');
    if (!row) {
      return {
        logo: null,
        palette: defaultBrandingPalette,
      };
    }
    return {
      logo: parsePublishedLogo(row),
      palette: parsePalette(row),
    };
  } catch {
    return {
      logo: null,
      palette: defaultBrandingPalette,
    };
  }
}

