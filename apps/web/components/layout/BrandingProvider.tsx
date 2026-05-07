'use client';

import { createContext, useContext } from 'react';
import type { BrandingPresentation } from '@/lib/branding/defaults';

const BrandingContext = createContext<BrandingPresentation>({
  logo: null,
  palette: {
    primary: '#1B3F6E',
    secondary: '#C9952A',
    background: '#F7F5F0',
    text: '#1A1A1A',
    border: '#E4E0D6',
  },
});

export function BrandingProvider({
  value,
  children,
}: {
  value: BrandingPresentation;
  children: React.ReactNode;
}) {
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}

