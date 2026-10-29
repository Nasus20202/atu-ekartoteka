import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        // Generated Prisma client
        'src/generated/**',
        // Type-only modules without runtime code
        'src/lib/types/*.ts',
        '**/types.ts',
        // Test setup and shared fixtures
        'src/__tests__/**',
        // Next.js route shells, covered by E2E tests
        'src/app/**/{page,layout,not-found,error,loading}.tsx',
        // OpenTelemetry SDK bootstrap; its logic lives in tracing-utils.ts
        'src/lib/opentelemetry/tracing.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
