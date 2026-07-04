/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  // remark-github-blockquote-alert injects these class names at render time,
  // so they never appear as literal strings in the scanned content above and
  // would otherwise be purged from the build.
  safelist: [
    'markdown-alert',
    'markdown-alert-title',
    'markdown-alert-note',
    'markdown-alert-tip',
    'markdown-alert-important',
    'markdown-alert-warning',
    'markdown-alert-caution',
    'octicon',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
};
