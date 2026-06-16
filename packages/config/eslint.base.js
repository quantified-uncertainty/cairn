import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Shared base ESLint flat config for all Cairn apps.
// Apps import this directly (`import baseConfig from '@cairn/config/eslint'`),
// or spread it and append app-specific blocks (see apps/longterm).
export const baseConfig = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript - relaxed for gradual adoption
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**'],
  }
);

export default baseConfig;
