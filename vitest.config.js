import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'packages/**/src/**/*.{js,ts}',
        'packages/**/*.js',
        'apps/**/src/**/*.{js,ts}',
        'apps/**/*.js'
      ],
      exclude: [
        'node_modules',
        'dist',
        '.next',
        'build',
        '**/*.config.js',
        '**/*.test.js',
        '**/*.spec.js',
        '**/test/**',
        '**/tests/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});