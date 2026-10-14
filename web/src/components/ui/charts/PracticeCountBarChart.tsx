import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import { PracticeCountBucket } from '../../../types/api';

import {
  CHART_TEXT_CLASSNAME,
  GLASS_BAR_STROKE,
  GLASS_BAR_STROKE_WIDTH,
  GLASS_FILL_OPACITY,
  GLASS_TOOLTIP_STYLE,
} from './chartGlassStyles';

interface PracticeCountBarChartProps {
  /** Buckets in display order; `range` is used as the x-axis label. */
  data: readonly PracticeCountBucket[];
  /** Total number of entities, shown in the heading above the chart. */
  total: number;
  /** Singular noun for what is being counted; pluralized with a trailing "s". */
  entity: 'word' | 'question';
}

/**
 * Bar chart of how many entities fall into each practice count range, with a
 * heading above and an x-axis caption below. Shared by the word and question
 * statistics modals so both render the distribution identically.
 */
export const PracticeCountBarChart: React.FC<PracticeCountBarChartProps> = ({
  data,
  total,
  entity,
}) => {
  const plural = `${entity}s`;

  return (
    <>
      <p className='mb-4 text-sm text-gray-500 dark:text-gray-400'>
        Practice count distribution — {total} {plural} total
      </p>
      <ResponsiveContainer
        width='100%'
        height={280}
        className={CHART_TEXT_CLASSNAME}
      >
        <BarChart
          data={[...data]}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='currentColor'
            className='opacity-10'
          />
          <XAxis
            dataKey='range'
            tick={{ fontSize: 11, fill: 'currentColor' }}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'currentColor' }}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value, _name) => [`${value} ${plural}`, 'Count']}
            contentStyle={GLASS_TOOLTIP_STYLE}
          />
          <Bar
            dataKey='count'
            radius={[3, 3, 0, 0]}
            fill='#6366f1'
            fillOpacity={GLASS_FILL_OPACITY}
            stroke={GLASS_BAR_STROKE}
            strokeWidth={GLASS_BAR_STROKE_WIDTH}
          />
        </BarChart>
      </ResponsiveContainer>
      <p className='text-supporting mt-2 text-center text-xs'>
        Times practiced (per {entity})
      </p>
    </>
  );
};
