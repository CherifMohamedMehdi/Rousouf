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
          blue: 'rgb(var(--brand-blue-rgb) / <alpha-value>)',
          'blue-dark': 'rgb(var(--brand-blue-dark-rgb) / <alpha-value>)',
          'blue-soft': 'rgb(var(--brand-blue-soft-rgb) / <alpha-value>)',
          gold: 'rgb(var(--brand-gold-rgb) / <alpha-value>)',
          'gold-dark': 'rgb(var(--brand-gold-dark-rgb) / <alpha-value>)',
          'gold-soft': 'rgb(var(--brand-gold-soft-rgb) / <alpha-value>)',
          paper: 'rgb(var(--brand-paper-rgb) / <alpha-value>)',
          'paper-soft': 'rgb(var(--brand-paper-soft-rgb) / <alpha-value>)',
          ink: 'rgb(var(--brand-ink-rgb) / <alpha-value>)',
          'ink-soft': 'rgb(var(--brand-ink-soft-rgb) / <alpha-value>)',
          teal: 'rgb(var(--brand-teal-rgb) / <alpha-value>)',
          'teal-soft': 'rgb(var(--brand-teal-soft-rgb) / <alpha-value>)',
        },
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--muted-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground-rgb) / <alpha-value>)',
        },
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        ring: 'rgb(var(--ring-rgb) / <alpha-value>)',
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
