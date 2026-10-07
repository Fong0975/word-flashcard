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
  CHART_TEXT_CLASSNAME,
  GLASS_TOOLTIP_STYLE,
} from '../../../../components/ui/charts/chartGlassStyles';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { apiService } from '../../../../lib/api';
import { Word, WordPracticeLogEntry } from '../../../../types/api';
import { useAsyncOnOpen } from '../../../shared/hooks/useAsyncOnOpen';
import { FamiliarityLevel } from '../../../../types/base';
import {
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

/** Chart tick labels, indexed by the ordinal returned from `familiarityLevel`. */
const FAMILIARITY_LEVEL_LABELS = [
  FamiliarityLevel.RED,
  FamiliarityLevel.YELLOW,
  FamiliarityLevel.GREEN,
].map(level => FAMILIARITY_LABELS[level]);

/** Wide enough for the longest familiarity label at the 11px tick font size. */
const Y_AXIS_WIDTH = 72;

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

  const chartData = logs
    ? [...logs].reverse().map((entry, index) => ({
        index,
        level: familiarityLevel(entry.familiarity),
        created_at: entry.created_at,
      }))
    : [];

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
                tick={{ fontSize: 11, fill: 'currentColor' }}
                tickFormatter={i =>
                  chartData[i] ? formatShortDate(chartData[i].created_at) : ''
                }
              />
              <YAxis
                width={Y_AXIS_WIDTH}
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
                labelFormatter={i =>
                  chartData[i as number]
                    ? formatDateTime(chartData[i as number].created_at)
                    : ''
                }
                contentStyle={GLASS_TOOLTIP_STYLE}
              />
              <Line
                type='stepAfter'
                dataKey='level'
                stroke='#6366f1'
                dot={false}
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
