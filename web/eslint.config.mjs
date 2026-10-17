import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tailwindcss from 'eslint-plugin-tailwindcss';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs['flat/recommended'],
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs['recommended-latest'],
  prettierConfig,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
      tailwindcss,
      import: importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      tailwindcss: {
        cssConfigPath: './src/index.css',
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React specific rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // TypeScript's own type checking supersedes PropTypes; react-app's legacy
      // config excluded this rule for the same reason.
      'react/prop-types': 'off',

      // Import/Export rules
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
        },
      ],

      // General code quality rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // Prettier integration
      'prettier/prettier': 'error',

      // Tailwind CSS rules
      'tailwindcss/classnames-order': 'warn',
      // The v4 plugin only knows Tailwind's own utilities, not the plain CSS
      // classes in index.css, so those are listed here.
      'tailwindcss/no-custom-classname': [
        'warn',
        {
          whitelist: [
            'glass-[a-z-]+',
            'focus-ring(-[a-z]+)?',
            'text-(supporting|subtle|error)',
            'segmented-divider',
            'animate-(slide-in-right|slide-out-right|toast-progress)',
          ],
        },
      ],
      'tailwindcss/no-contradicting-classname': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/api.ts'],
    rules: {
      'max-lines': [
        'warn',
        { max: 380, skipBlankLines: false, skipComments: false },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'react/display-name': 'off',
    },
  },
];
