import type { DirectusFile } from '@/types/directus';

export type BrandingPalette = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
};

export type BrandingSnapshot = {
  logo?: DirectusFile | null;
  palette: BrandingPalette;
};

export type BrandingPresentation = {
  logo: DirectusFile | null;
  palette: BrandingPalette;
};

export const defaultBrandingPalette: BrandingPalette = {
  primary: '#1B3F6E',
  secondary: '#C9952A',
  background: '#F7F5F0',
  text: '#1A1A1A',
  border: '#E4E0D6',
};

export const defaultBrandingPresentation: BrandingPresentation = {
  logo: null,
  palette: defaultBrandingPalette,
};

