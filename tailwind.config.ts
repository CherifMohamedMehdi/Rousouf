/**
 * Tailwind configuration — the single source of truth for Roufouf's visual
 * identity tokens.
 *
 * What lives here:
 * - The brand palette (blue/gold/paper/ink/teal) exposed as `brand.*` colors.
 * - Typography stacks for Latin (IBM Plex Sans) and Arabic (IBM Plex Sans
 *   Arabic); the Arabic stack is applied automatically on RTL pages via a
 *   utility class on `<html>`.
 * - A small set of semantic tokens (`background`, `foreground`, `muted`, …)
 *   that every component should consume instead of hardcoding hex values.
 *
 * How to edit:
 * - Change a brand color once here; every component follows.
 * - To add a new semantic color, extend `colors` and reference the new name
 *   in components via className (e.g. `bg-accent-soft`). Do not hardcode hex
 *   values in component files.
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1B3F6E',
          'blue-dark': '#142E52',
          'blue-soft': '#EAF0F8',
          gold: '#C9952A',
          'gold-dark': '#9C7220',
          'gold-soft': '#F7EED8',
          paper: '#F7F5F0',
          'paper-soft': '#FBFAF6',
          ink: '#1A1A1A',
          'ink-soft': '#4A4A4A',
          teal: '#2A7B6F',
          'teal-soft': '#DEEFEC',
        },
        background: '#F7F5F0',
        foreground: '#1A1A1A',
        muted: {
          DEFAULT: '#EFEDE6',
          foreground: '#4A4A4A',
        },
        border: '#E4E0D6',
        ring: '#C9952A',
      },
      fontFamily: {
        sans: ['var(--font-plex-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-plex-sans-arabic)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        display: ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26, 26, 26, 0.04), 0 4px 12px rgba(26, 26, 26, 0.04)',
        'card-hover': '0 2px 4px rgba(26, 26, 26, 0.06), 0 12px 32px rgba(26, 26, 26, 0.08)',
        ring: '0 0 0 3px rgba(201, 149, 42, 0.35)',
      },
      borderRadius: {
        lg: '0.75rem',
      },
      maxWidth: {
        prose: '68ch',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
