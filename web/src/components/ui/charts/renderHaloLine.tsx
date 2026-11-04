import React from 'react';
import { Line } from 'recharts';

/** Stroke width of a trend line, and of the halo drawn behind it. */
export const TREND_LINE_STROKE_WIDTH = 3.5;
export const TREND_LINE_HALO_WIDTH = 4.5;

/**
 * Radius of the point marker on each data point. Lines break at null values
 * (days without practice), so an isolated day would otherwise draw nothing.
 */
export const TREND_LINE_DOT_RADIUS = 3.5;

/** Inner fill and ring width of a point marker; the ring uses the line color. */
export const TREND_LINE_DOT_FILL = '#ffffff';
export const TREND_LINE_DOT_STROKE_WIDTH = 2;

/**
 * Halo color, resolved through a CSS variable because recharts color props
 * can't read Tailwind's `dark:` variant. Currently transparent in both themes,
 * so lines are drawn without a visible outline.
 */
export const TREND_LINE_HALO_COLOR = 'var(--chart-line-halo)';

/**
 * Trend line colors, resolved through CSS variables so each theme can use its
 * own hue (recharts color props can't read Tailwind's `dark:` variant).
 */
export const TREND_LINE_FAMILIARITY_COLOR = 'var(--chart-line-familiarity)';
export const TREND_LINE_IMPROVEMENT_COLOR = 'var(--chart-line-improvement)';
export const TREND_LINE_ACCURACY_COLOR = 'var(--chart-line-accuracy)';

interface HaloLineOptions {
  dataKey: string;
  name: string;
  stroke: string;
  yAxisId?: string;
}

/**
 * Build a trend line outlined by a halo. Null values break the line instead of
 * being bridged, so days without data are not mistaken for interpolated ones. recharts' `Line` has no outline
 * option, so the halo is a wider line on the same path drawn just before it,
 * hidden from the legend and the tooltip. Returned as an array (not a wrapper
 * component) so both lines stay direct chart children, in drawing order.
 *
 * @returns The halo line followed by the visible line
 */
export const renderHaloLine = ({
  dataKey,
  name,
  stroke,
  yAxisId,
}: HaloLineOptions): React.ReactElement[] => [
  <Line
    key={`${dataKey}-halo`}
    yAxisId={yAxisId}
    dataKey={dataKey}
    stroke={TREND_LINE_HALO_COLOR}
    strokeWidth={TREND_LINE_HALO_WIDTH}
    strokeLinecap='round'
    strokeLinejoin='round'
    dot={false}
    activeDot={false}
    legendType='none'
    tooltipType='none'
  />,
  <Line
    key={dataKey}
    yAxisId={yAxisId}
    dataKey={dataKey}
    stroke={stroke}
    strokeWidth={TREND_LINE_STROKE_WIDTH}
    dot={{
      r: TREND_LINE_DOT_RADIUS,
      fill: TREND_LINE_DOT_FILL,
      stroke,
      strokeWidth: TREND_LINE_DOT_STROKE_WIDTH,
    }}
    activeDot={{ r: 4, stroke: TREND_LINE_HALO_COLOR, strokeWidth: 2 }}
    name={name}
  />,
];
