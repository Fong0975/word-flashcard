import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import {
  CHART_ACTIVE_DOT_RADIUS,
  CHART_AXIS_TICK_MARGIN,
  CHART_TEXT_CLASSNAME,
  CHART_X_AXIS_HEIGHT,
  GLASS_TOOLTIP_STYLE,
} from '../../../../components/ui/charts/chartGlassStyles';
import { GlassDot } from '../../../../components/ui/charts/GlassDot';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { apiService } from '../../../../lib/api';
import { Word, WordPracticeLogEntry } from '../../../../types/api';
import { useAsyncOnOpen } from '../../../shared/hooks/useAsyncOnOpen';
import { FamiliarityLevel } from '../../../../types/base';
import {
  FAMILIARITY_CHART_COLORS,
  FAMILIARITY_LABELS,
  getFamiliarityDisplayColors,
  getFamiliarityLabel,
} from '../../../shared/constants/familiarity';
import {
  formatShortDate,
  formatDateTime,
  formatDateTimeParts,
} from '../../../../utils/dateFormat';

interface WordHistorySectionProps {
  word: Word;
}

/** Familiarity levels, indexed by the ordinal returned from `familiarityLevel`. */
const FAMILIARITY_LEVELS = [
  FamiliarityLevel.RED,
  FamiliarityLevel.YELLOW,
  FamiliarityLevel.GREEN,
];

/** Chart tick labels, indexed by the ordinal returned from `familiarityLevel`. */
const FAMILIARITY_LEVEL_LABELS = FAMILIARITY_LEVELS.map(
  level => FAMILIARITY_LABELS[level],
);

/**
 * Wide enough for the longest familiarity label at the 11px tick font size,
 * plus the extra tick margin.
 */
const Y_AXIS_WIDTH = 80;

export const familiarityLevel = (familiarity: string): number => {
  switch (familiarity) {
    case 'yellow':
      return 1;
    case 'green':
      return 2;
    default:
      return 0;
  }
};

export interface HistoryChartPoint {
  index: number;
  level: number;
  /** `null` for the starting point, which precedes the oldest practice. */
  created_at: string | null;
}

/** Tooltip label of the point that precedes the oldest practice. */
const STARTING_POINT_LABEL = 'Before practice';

/** Every word starts out unfamiliar, before any practice. */
const STARTING_LEVEL = 0;

/**
 * Build the line chart points in chronological order, led by an unfamiliar
 * starting point, so the first practice is drawn as a transition instead of
 * an isolated dot.
 *
 * @param logs - Practice log entries, newest first
 * @returns The chart points, or an empty array when there are no entries
 */
export const buildHistoryChartData = (
  logs: readonly WordPracticeLogEntry[],
): HistoryChartPoint[] => {
  if (logs.length === 0) {
    return [];
  }
  const chronological = [...logs].reverse();
  return [
    { index: 0, level: STARTING_LEVEL, created_at: null },
    ...chronological.map((entry, index) => ({
      index: index + 1,
      level: familiarityLevel(entry.familiarity),
      created_at: entry.created_at,
    })),
  ];
};

interface FamiliarityDotProps {
  cx?: number;
  cy?: number;
  payload?: { level: number };
  /** Named `radius` because recharts overwrites `r` when cloning the element. */
  radius?: number;
}

/**
 * Line chart data point filled with the color of its familiarity level.
 * recharts injects `cx`, `cy` and `payload` when it clones the element passed
 * to `dot` / `activeDot`.
 *
 * @returns The dot, or `null` when recharts has no position for the point
 */
export const FamiliarityDot: React.FC<FamiliarityDotProps> = ({
  cx,
  cy,
  payload,
  radius,
}) => {
  if (!payload) {
    return null;
  }
  return (
    <GlassDot
      cx={cx}
      cy={cy}
      radius={radius}
      fill={FAMILIARITY_CHART_COLORS[FAMILIARITY_LEVELS[payload.level]]}
    />
  );
};

interface FamiliarityBadgeProps {
  familiarity: string;
}

const FamiliarityBadge: React.FC<FamiliarityBadgeProps> = ({ familiarity }) => {
  const colors = getFamiliarityDisplayColors(familiarity);
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      {getFamiliarityLabel(familiarity)}
    </span>
  );
};

export const WordHistorySection: React.FC<WordHistorySectionProps> = ({
  word,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    data: logs,
    loading,
    error,
  } = useAsyncOnOpen<WordPracticeLogEntry[]>({
    isOpen,
    fetcher: () => apiService.getWordLogs(word.id, 10),
    errorMessage: 'Failed to load practice history.',
  });

  const chartData = logs ? buildHistoryChartData(logs) : [];

  return (
    <CollapsibleSection
      title='Recent Practice History'
      isOpen={isOpen}
      onToggle={() => setIsOpen(open => !open)}
    >
      {loading && <LoadingSpinner message='Loading history...' />}

      {error && (
        <div className='text-error py-4 text-center text-sm'>{error}</div>
      )}

      {!loading && !error && logs && logs.length === 0 && (
        <p className='py-4 text-center text-sm text-gray-500 dark:text-gray-400'>
          No practice history yet.
        </p>
      )}

      {!loading && !error && logs && logs.length > 0 && (
        <>
          <ResponsiveContainer
            width='100%'
            height={160}
            className={CHART_TEXT_CLASSNAME}
          >
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='currentColor'
                className='opacity-10'
              />
              <XAxis
                dataKey='index'
                axisLine={false}
                tickLine={false}
                tickMargin={CHART_AXIS_TICK_MARGIN}
                height={CHART_X_AXIS_HEIGHT}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                tickFormatter={i => {
                  const createdAt = chartData[i]?.created_at;
                  return createdAt ? formatShortDate(createdAt) : '';
                }}
              />
              <YAxis
                width={Y_AXIS_WIDTH}
                axisLine={false}
                tickLine={false}
                tickMargin={CHART_AXIS_TICK_MARGIN}
                domain={[0, 2]}
                ticks={[0, 1, 2]}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                tickFormatter={v => FAMILIARITY_LEVEL_LABELS[v as number]}
              />
              <Tooltip
                formatter={value => [
                  FAMILIARITY_LEVEL_LABELS[value as number],
                  'Familiarity',
                ]}
                labelFormatter={i => {
                  const point = chartData[i as number];
                  if (!point) {
                    return '';
                  }
                  return point.created_at
                    ? formatDateTime(point.created_at)
                    : STARTING_POINT_LABEL;
                }}
                contentStyle={GLASS_TOOLTIP_STYLE}
              />
              <Line
                type='stepAfter'
                dataKey='level'
                stroke='currentColor'
                dot={<FamiliarityDot />}
                activeDot={<FamiliarityDot radius={CHART_ACTIVE_DOT_RADIUS} />}
              />
            </LineChart>
          </ResponsiveContainer>

          <ul className='mt-4 space-y-2'>
            {logs.map(entry => {
              const { date, time } = formatDateTimeParts(entry.created_at);
              return (
                <li
                  key={entry.id}
                  className='flex items-center justify-between gap-2 text-sm'
                >
                  <span className='flex flex-col text-gray-500 dark:text-gray-400'>
                    <span>{date}</span>
                    <span className='text-xs'>{time}</span>
                  </span>
                  <span className='flex flex-shrink-0 items-center gap-1.5'>
                    <FamiliarityBadge
                      familiarity={entry.previous_familiarity}
                    />
                    <span className='text-subtle'>&rarr;</span>
                    <FamiliarityBadge familiarity={entry.familiarity} />
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </CollapsibleSection>
  );
};
