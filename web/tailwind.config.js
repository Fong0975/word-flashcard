/**
 * Page backdrop painted by `PageBackground`: three large corner washes plus
 * four smaller, tighter orbs. The orbs keep a near-flat core and a short
 * falloff so they stay recognisable shapes through a panel's backdrop blur;
 * the centered one gives tall overlays (e.g. a large modal) color to reveal.
 * Sizes are in `vmax` so the composition scales from phone to desktop.
 * Peak alphas are capped so supporting text keeps WCAG AA on the lightest
 * glass tier; re-check contrast before raising any of them.
 */
const glassBackdrop = [
  'radial-gradient(circle 16vmax at 78% 38%, rgb(96 165 250 / 0.35) 0%, rgb(96 165 250 / 0.3) 50%, transparent 68%)',
  'radial-gradient(circle 13vmax at 18% 62%, rgb(165 180 252 / 0.5) 0%, rgb(165 180 252 / 0.42) 50%, transparent 68%)',
  'radial-gradient(circle 20vmax at 92% 92%, rgb(147 197 253 / 0.6) 0%, rgb(147 197 253 / 0.5) 48%, transparent 66%)',
  'radial-gradient(circle 11vmax at 50% 46%, rgb(125 211 252 / 0.45) 0%, rgb(125 211 252 / 0.38) 50%, transparent 68%)',
  'radial-gradient(circle 46vmax at 0% 0%, rgb(147 197 253 / 0.7) 0%, rgb(147 197 253 / 0.35) 45%, transparent 75%)',
  'radial-gradient(circle 44vmax at 100% 5%, rgb(165 180 252 / 0.55) 0%, transparent 72%)',
  'radial-gradient(circle 42vmax at 30% 105%, rgb(125 211 252 / 0.6) 0%, transparent 72%)',
].join(', ');

const glassBackdropDark = [
  'radial-gradient(circle 16vmax at 78% 38%, rgb(59 130 246 / 0.22) 0%, rgb(59 130 246 / 0.18) 50%, transparent 68%)',
  'radial-gradient(circle 13vmax at 18% 62%, rgb(99 102 241 / 0.28) 0%, rgb(99 102 241 / 0.22) 50%, transparent 68%)',
  'radial-gradient(circle 20vmax at 92% 92%, rgb(29 78 216 / 0.32) 0%, rgb(29 78 216 / 0.26) 48%, transparent 66%)',
  'radial-gradient(circle 11vmax at 50% 46%, rgb(2 132 199 / 0.2) 0%, rgb(2 132 199 / 0.16) 50%, transparent 68%)',
  'radial-gradient(circle 46vmax at 0% 0%, rgb(37 99 235 / 0.28) 0%, rgb(37 99 235 / 0.14) 45%, transparent 75%)',
  'radial-gradient(circle 44vmax at 100% 5%, rgb(79 70 229 / 0.3) 0%, transparent 72%)',
  'radial-gradient(circle 42vmax at 30% 105%, rgb(3 105 161 / 0.35) 0%, transparent 72%)',
].join(', ');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
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
      // Glass lighting: a top-edge highlight and a faint bottom edge (both
      // inset) plus a soft ambient shadow. Colors come from the `--glass-*`
      // variables in index.css, so one class serves both themes.
      boxShadow: {
        glass:
          'inset 0 1px 0 0 var(--glass-highlight), inset 0 -1px 0 0 var(--glass-edge), 0 6px 16px -6px var(--glass-shadow)',
        'glass-raised':
          'inset 0 1px 0 0 var(--glass-highlight), inset 0 -1px 0 0 var(--glass-edge), 0 16px 36px -10px var(--glass-shadow)',
        // `glass` plus a tinted rim light: an inner glow hugging the edge and a
        // short outer halo. The halo stays within the 12px page gutter so the
        // `overflow-hidden` shell does not cut it off at phone width. The hue
        // comes from `--glass-glow`, set by a `.glass-glow-*` tone class. The
        // glow layers are appended after the three `glass` layers so the two
        // lists line up and the glow can fade in and out as a transition.
        'glass-glow':
          'inset 0 1px 0 0 var(--glass-highlight), inset 0 -1px 0 0 var(--glass-edge), 0 6px 16px -6px var(--glass-shadow), inset 0 0 28px -8px rgb(var(--glass-glow) / var(--glass-glow-inner)), 0 0 14px 0 rgb(var(--glass-glow) / var(--glass-glow-outer))',
      },
      backgroundImage: {
        'glass-backdrop': glassBackdrop,
        'glass-backdrop-dark': glassBackdropDark,
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
};
