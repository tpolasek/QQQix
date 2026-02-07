import { defineConfig } from 'vitest/config';
import { canvas } from './vitest.setup.ts';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    testTimeout: 10000,
    setupFiles: ['./vitest.setup.ts']
  }
});
