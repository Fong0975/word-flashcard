import React from 'react';

/**
 * recharts' `contentStyle` prop is a plain inline style object — it can't
 * read Tailwind's `dark:` variant. A single frosted-dark tooltip (instead of
 * switching color per theme) keeps every chart tooltip legible and glassy
 * against both a light and a dark page background.
 */
export const GLASS_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(31, 41, 55, 0.85)',
  backdropFilter: 'blur(6px)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 8,
  color: '#f3f4f6',
  fontSize: '12px',
};

/** Tailwind classes for the same frosted-dark tooltip when it needs to be
 * built from a custom `content` component instead of `contentStyle`. */
export const GLASS_TOOLTIP_CLASSNAME =
  'rounded-md border border-white/10 bg-gray-800/85 px-2 py-1 text-xs text-gray-100 shadow-lg backdrop-blur-md';

/**
 * Wraps a `ResponsiveContainer` so axis ticks (`fill: 'currentColor'`) and
 * `CartesianGrid` (`stroke: 'currentColor'`) resolve to the same muted,
 * theme-aware label color instead of each hardcoding its own gray.
 */
export const CHART_TEXT_CLASSNAME = 'text-gray-500 dark:text-gray-400';

/** Frosted edge highlight for Bar/Cell fills, so solid chart colors read as
 * glass instead of flat blocks. Kept barely visible (thin, low alpha) so it
 * reads as a soft edge rather than an outline. */
export const GLASS_BAR_STROKE = 'rgba(255, 255, 255, 0.25)';
export const GLASS_BAR_STROKE_WIDTH = 0.5;
export const GLASS_FILL_OPACITY = 0.85;

export const glassLegendFormatter = (value: string) => (
  <span className={CHART_TEXT_CLASSNAME}>{value}</span>
);
