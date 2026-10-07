import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.mts';

const TEST_FILE_GLOB = 'src/**/*.test.{ts,tsx}';
const TEST_FILE_PATTERN = /\.test\.tsx?$/;
const MODULE_MOCKING_PATTERN = /\bvi\.(mock|doMock|resetModules)\(/;

/**
 * Finds the test files that replace or reset modules.
 *
 * Module mocks only take effect when the module under test is evaluated
 * after the mock is registered. In a worker that shares its module cache
 * between test files, an earlier file may already have cached that module
 * with real (or differently mocked) dependencies, so these files must keep
 * running in isolation.
 *
 * @returns Paths relative to this config file, using forward slashes.
 */
const findModuleMockingTestFiles = (): string[] => {
  const root = fileURLToPath(new URL('.', import.meta.url));
  return readdirSync(join(root, 'src'), { recursive: true, encoding: 'utf8' })
    .filter(file => TEST_FILE_PATTERN.test(file))
    .map(file => `src/${file.replace(/\\/g, '/')}`)
    .filter(file =>
      MODULE_MOCKING_PATTERN.test(readFileSync(join(root, file), 'utf8')),
    );
};

const moduleMockingTestFiles = findModuleMockingTestFiles();

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      globals: true,
      css: false,
      // Creating a jsdom environment and re-importing React/Testing Library
      // for every test file dominated the run time, so files share a worker's
      // module cache unless they need module mocking.
      projects: [
        {
          extends: true,
          test: {
            name: 'shared',
            include: [TEST_FILE_GLOB],
            exclude: [...configDefaults.exclude, ...moduleMockingTestFiles],
            isolate: false,
          },
        },
        {
          extends: true,
          test: {
            name: 'isolated',
            include: moduleMockingTestFiles,
            isolate: true,
          },
        },
      ],
      coverage: {
        provider: 'v8',
        reporter: ['json', 'text', 'lcov', 'clover', 'json-summary'],
        reportsDirectory: './coverage',
        exclude: [
          'node_modules/',
          'src/test-utils/**',
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
