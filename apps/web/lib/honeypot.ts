/**
 * Honeypot anti-spam helper.
 *
 * Every public form renders a hidden `website` input styled with
 * `display:none` and `aria-hidden`. Humans never touch it; bots fill it.
 * The server rejects any submission where it is non-empty.
 */

export const HONEYPOT_FIELD = 'website';

export function failsHoneypot(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function honeypotInputProps() {
  return {
    type: 'text' as const,
    name: HONEYPOT_FIELD,
    autoComplete: 'off',
    tabIndex: -1,
    'aria-hidden': true,
    style: {
      position: 'absolute' as const,
      left: '-9999px',
      width: '1px',
      height: '1px',
      opacity: 0,
      pointerEvents: 'none' as const,
    },
  };
}
