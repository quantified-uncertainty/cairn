import baseConfig from '@cairn/config/eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    rules: {
      // Scripts can use console and any
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['.cache/**', 'src/data/*.json'],
  },
];
