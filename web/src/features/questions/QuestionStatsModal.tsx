import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiService } from '../../lib/api';
import { PracticeCountBucket, QuestionStatsResponse } from '../../types/api';
import { useAsyncOnOpen } from '../shared/hooks/useAsyncOnOpen';

interface TooltipPayload {
  payload: {
    range: string;
    count: number;
    practice_count_breakdown: readonly PracticeCountBucket[];
  };
}

export const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) => {
  if (!active || !payload?.length) {
    return null;
  }
  const { range, count, practice_count_breakdown } = payload[0].payload;
  const breakdown = practice_count_breakdown.filter(bucket => bucket.count > 0);

  return (
    <div className='rounded border border-gray-200 bg-white px-2 py-1 text-xs shadow dark:border-gray-600 dark:bg-gray-800 dark:text-white'>
      <div>
        {range}: {count} questions
      </div>
      {breakdown.length > 0 && (
        <div className='mt-1 border-t border-gray-200 pt-1 dark:border-gray-600'>
          <div className='text-gray-500 dark:text-gray-400'>
            By practice count:
          </div>
          {breakdown.map(bucket => (
            <div key={bucket.range} className='flex justify-between gap-3'>
              <span>{bucket.range}</span>
              <span>{bucket.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface QuestionStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getBarColor = (range: string): string => {
  if (range === 'N/A') {
    return '#9ca3af';
  }
  if (range === '0%') {
    return '#ef4444';
  }
  const match = range.match(/^(\d+)/);
  if (!match) {
    return '#9ca3af';
  }
  const lower = parseInt(match[1], 10);
  if (lower >= 80) {
    return '#22c55e';
  }
  if (lower >= 50) {
    return '#eab308';
  }
  return '#ef4444';
};

export const QuestionStatsModal: React.FC<QuestionStatsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    data: stats,
    loading,
    error,
  } = useAsyncOnOpen<QuestionStatsResponse>({
    isOpen,
    fetcher: () => apiService.getQuestionStats(),
    errorMessage: 'Failed to load question statistics.',
  });

  const chartData = stats ? [...stats.accuracy_distribution].reverse() : [];
  const total = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Question Statistics'
      maxWidth='lg'
    >
      {loading && <LoadingSpinner message='' />}

      {error && (
        <div className='flex h-48 items-center justify-center text-sm text-red-500'>
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <p className='mb-4 text-sm text-gray-500 dark:text-gray-400'>
            Accuracy distribution — {total} questions total
          </p>
          <ResponsiveContainer width='100%' height={260}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
            >
              <XAxis
                dataKey='range'
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-35}
                textAnchor='end'
                height={52}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey='count' radius={[3, 3, 0, 0]}>
                {chartData.map(entry => (
                  <Cell key={entry.range} fill={getBarColor(entry.range)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className='mt-2 flex justify-center gap-6 text-xs text-gray-500 dark:text-gray-400'>
            <span className='flex items-center gap-1'>
              <span className='inline-block h-2.5 w-2.5 rounded-sm bg-green-500'></span>
              80–100%
            </span>
            <span className='flex items-center gap-1'>
              <span className='inline-block h-2.5 w-2.5 rounded-sm bg-yellow-400'></span>
              50–79%
            </span>
            <span className='flex items-center gap-1'>
              <span className='inline-block h-2.5 w-2.5 rounded-sm bg-red-500'></span>
              0–49%
            </span>
            <span className='flex items-center gap-1'>
              <span className='inline-block h-2.5 w-2.5 rounded-sm bg-gray-400'></span>
              N/A
            </span>
          </div>
        </>
      )}
    </Modal>
  );
};
