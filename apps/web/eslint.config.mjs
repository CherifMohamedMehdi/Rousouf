import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextConfigs = require('eslint-config-next/core-web-vitals');

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'workers/**/node_modules/**'],
  },
  ...nextConfigs,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      // Strict in React 19 / eslint-plugin-react-hooks 7; existing URL + modal resets are intentional.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
