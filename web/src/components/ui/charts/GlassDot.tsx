import React from 'react';

import {
  CHART_DOT_RADIUS,
  GLASS_BAR_STROKE,
  GLASS_BAR_STROKE_WIDTH,
} from './chartGlassStyles';

interface GlassDotProps {
  cx?: number;
  cy?: number;
  fill: string;
  radius?: number;
}

/**
 * Solid line chart data point with the same frosted edge as chart bars.
 *
 * @returns The dot, or `null` when recharts has no position for the point
 */
export const GlassDot: React.FC<GlassDotProps> = ({
  cx,
  cy,
  fill,
  radius = CHART_DOT_RADIUS,
}) => {
  if (cx === undefined || cy === undefined) {
    return null;
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={fill}
      stroke={GLASS_BAR_STROKE}
      strokeWidth={GLASS_BAR_STROKE_WIDTH}
    />
  );
};
