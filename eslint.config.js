import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        google: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: [
      'tests/**/*.js',
      'scripts/**/*.mjs',
      'vite.config.js',
      'vitest.config.js',
      'playwright.config.js',
      'eslint.config.js',
      'site.config.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      // E2E testleri Playwright'ın page.evaluate'i üzerinden tarayıcı
      // bağlamında da kod çalıştırır (window, document, getComputedStyle).
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
