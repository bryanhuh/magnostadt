import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'trpc',
          root: path.resolve(__dirname, 'packages/trpc'),
          environment: 'node',
          include: ['src/__tests__/**/*.test.ts'],
          globals: true,
          setupFiles: [path.resolve(__dirname, 'packages/trpc/src/__tests__/setup.ts')],
        },
      },
      {
        test: {
          name: 'web',
          root: path.resolve(__dirname, 'apps/web'),
          environment: 'happy-dom',
          include: ['src/**/__tests__/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
          globals: true,
          setupFiles: [path.resolve(__dirname, 'apps/web/src/__tests__/setup.ts')],
        },
      },
    ],
  },
});
