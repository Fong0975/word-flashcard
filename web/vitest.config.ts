import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

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
          'src/features/words/word-detail/types/word-detail.ts',
          'src/features/words/word-form/types/word-form.ts',
        ],
      },
      reporters: ['default', 'vitest-ctrf-json-reporter'],
    },
  }),
);
