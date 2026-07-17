import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // E2E (Playwright) dosyaları vitest kapsamı dışında
    include: ['tests/*.test.js'],
  },
});
