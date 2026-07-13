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
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { apiService } from '../../../../lib/api';
import { Word, WordPracticeLogEntry } from '../../../../types/api';
import { useAsyncOnOpen } from '../../../shared/hooks/useAsyncOnOpen';
import { getFamiliarityDisplayColors } from '../../../shared/constants/familiarity';

interface WordHistorySectionProps {
  word: Word;
}

const FAMILIARITY_LEVEL_LABELS = ['Red', 'Yellow', 'Green'];

const familiarityLevel = (familiarity: string): number => {
  switch (familiarity) {
    case 'yellow':
      return 1;
    case 'green':
      return 2;
    default:
      return 0;
  }
};

const formatShortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString();

const formatDateTime = (iso: string): string => new Date(iso).toLocaleString();

interface FamiliarityBadgeProps {
  familiarity: string;
}

const FamiliarityBadge: React.FC<FamiliarityBadgeProps> = ({ familiarity }) => {
  const colors = getFamiliarityDisplayColors(familiarity);
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${colors.bg} ${colors.text}`}
    >
      {familiarity}
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
        <div className='py-4 text-center text-sm text-red-500'>{error}</div>
      )}

      {!loading && !error && logs && logs.length === 0 && (
        <p className='py-4 text-center text-sm text-gray-500 dark:text-gray-400'>
          No practice history yet.
        </p>
      )}

      {!loading && !error && logs && logs.length > 0 && (
        <>
          <ResponsiveContainer width='100%' height={160}>
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='currentColor'
                className='opacity-10'
              />
              <XAxis
                dataKey='index'
                tick={{ fontSize: 11 }}
                tickFormatter={i =>
                  chartData[i] ? formatShortDate(chartData[i].created_at) : ''
                }
              />
              <YAxis
                domain={[0, 2]}
                ticks={[0, 1, 2]}
                tick={{ fontSize: 11 }}
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
                contentStyle={{ fontSize: '12px' }}
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
            {logs.map(entry => (
              <li
                key={entry.id}
                className='flex items-center justify-between gap-2 text-sm'
              >
                <span className='text-gray-500 dark:text-gray-400'>
                  {formatDateTime(entry.created_at)}
                </span>
                <span className='flex items-center gap-1.5'>
                  <FamiliarityBadge familiarity={entry.previous_familiarity} />
                  <span className='text-gray-400'>&rarr;</span>
                  <FamiliarityBadge familiarity={entry.familiarity} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </CollapsibleSection>
  );
};
