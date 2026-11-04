import React from 'react';
import type { LegendPayload } from 'recharts';

import { CHART_TEXT_CLASSNAME } from './chartGlassStyles';
import {
  TREND_LINE_DOT_FILL,
  TREND_LINE_DOT_RADIUS,
  TREND_LINE_DOT_STROKE_WIDTH,
  TREND_LINE_STROKE_WIDTH,
} from './renderHaloLine';

const ICON_WIDTH = 24;
const ICON_HEIGHT = 14;
const BAR_ICON_SIZE = 12;

interface TrendLegendContentProps {
  payload?: readonly LegendPayload[];
}

const LineIcon: React.FC<{ color?: string }> = ({ color }) => (
  <svg
    aria-hidden='true'
    width={ICON_WIDTH}
    height={ICON_HEIGHT}
    viewBox={`0 0 ${ICON_WIDTH} ${ICON_HEIGHT}`}
  >
    <line
      x1={0}
      x2={ICON_WIDTH}
      y1={ICON_HEIGHT / 2}
      y2={ICON_HEIGHT / 2}
      stroke={color}
      strokeWidth={TREND_LINE_STROKE_WIDTH}
    />
    <circle
      cx={ICON_WIDTH / 2}
      cy={ICON_HEIGHT / 2}
      r={TREND_LINE_DOT_RADIUS}
      fill={TREND_LINE_DOT_FILL}
      stroke={color}
      strokeWidth={TREND_LINE_DOT_STROKE_WIDTH}
    />
  </svg>
);

const BarIcon: React.FC<{ color?: string }> = ({ color }) => (
  <svg
    aria-hidden='true'
    width={BAR_ICON_SIZE}
    height={BAR_ICON_SIZE}
    viewBox={`0 0 ${BAR_ICON_SIZE} ${BAR_ICON_SIZE}`}
  >
    <rect width={BAR_ICON_SIZE} height={BAR_ICON_SIZE} rx={2} fill={color} />
  </svg>
);

/**
 * Legend body for the Trend charts. recharts' default legend draws a plain
 * line for line series, so it can't show the white-filled data point the lines
 * carry; here line series get a line with a matching dot and bar series a
 * swatch in the bar color. recharts injects `payload` when it clones the
 * element passed to `content`.
 *
 * @returns The legend, or `null` without any visible entries
 */
export const TrendLegendContent: React.FC<TrendLegendContentProps> = ({
  payload,
}) => {
  // Series marked `legendType='none'` (the line halos) stay in the payload, so
  // they must be skipped here as recharts' default legend does.
  const entries = payload?.filter(entry => entry.type !== 'none') ?? [];
  if (entries.length === 0) {
    return null;
  }

  return (
    <ul
      className={`m-0 flex list-none flex-wrap items-center justify-center gap-x-4 gap-y-1 p-0 ${CHART_TEXT_CLASSNAME}`}
    >
      {entries.map(entry => (
        <li key={String(entry.value)} className='flex items-center gap-1.5'>
          {entry.type === 'line' ? (
            <LineIcon color={entry.color} />
          ) : (
            <BarIcon color={entry.color} />
          )}
          <span>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};
