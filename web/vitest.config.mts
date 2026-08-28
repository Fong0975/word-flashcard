import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.mts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      globals: true,
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['json', 'text', 'lcov', 'clover', 'json-summary'],
        reportsDirectory: './coverage',
        exclude: [
          'node_modules/',
          '**/index.{ts,tsx}',
          'src/features/questions/question-detail/types/question-detail.ts',
          'src/features/questions/question-form/types/question-form.ts',
          'src/features/questions/quiz/types.ts',
          'src/features/words/definition-form/types/cambridge.ts',
          'src/features/words/definition-form/types/form.ts',
          'src/types/api.ts',
          'src/types/base.ts',
          'src/types/components.ts',
          'src/types/hooks.ts',
          'src/types/backups.ts',
          'src/types/data-export.ts',
          'src/features/words/word-detail/types/word-detail.ts',
          'src/features/words/word-form/types/word-form.ts',
          'src/assets/images/**',
        ],
      },
      // Only emit the CTRF JSON report when explicitly requested (`npm run
      // test:ctrf`, used by CI) — not on every `npm test`/`npm run test:ci`,
      // where it would be dead weight for local development.
      //
      // Uses @d2t/vitest-ctrf-json-reporter, not the more obviously-named
      // `vitest-ctrf-json-reporter`: that package still implements the
      // Vitest 1.x/2.x `onFinished` reporter hook, which Vitest 4.x never
      // calls, so it silently produces no output. This one implements the
      // current `onTestRunEnd` hook.
      reporters: process.env.CTRF
        ? ['default', ['@d2t/vitest-ctrf-json-reporter', {}]]
        : ['default'],
    },
  }),
);
