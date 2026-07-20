import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Line,
  Legend,
  CartesianGrid,
} from 'recharts';

import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiService } from '../../lib/api';
import {
  PracticeCountBucket,
  QuestionStatsResponse,
  QuestionTrendPoint,
} from '../../types/api';
import { useAsyncOnOpen } from '../shared/hooks/useAsyncOnOpen';
import { formatShortDate } from '../../utils/dateFormat';

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

type ActiveTab = 'accuracy' | 'trend';

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('accuracy');

  const {
    data: stats,
    loading,
    error,
  } = useAsyncOnOpen<QuestionStatsResponse>({
    isOpen,
    fetcher: () => apiService.getQuestionStats(),
    errorMessage: 'Failed to load question statistics.',
  });

  const {
    data: trend,
    loading: trendLoading,
    error: trendError,
  } = useAsyncOnOpen<QuestionTrendPoint[]>({
    isOpen,
    fetcher: () => apiService.getQuestionsTrend(30),
    errorMessage: 'Failed to load answer trend.',
  });

  const hasTrendActivity = trend
    ? trend.some(point => point.practice_count > 0)
    : false;

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
          {/* Tab toggle */}
          <div className='mb-5 flex justify-center'>
            <div className='flex rounded-md border border-gray-300 text-sm dark:border-gray-600'>
              <button
                type='button'
                onClick={() => setActiveTab('accuracy')}
                className={`rounded-l-md px-4 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  activeTab === 'accuracy'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Accuracy
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('trend')}
                className={`rounded-r-md border-l border-gray-300 px-4 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-gray-600 ${
                  activeTab === 'trend'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Trend
              </button>
            </div>
          </div>

          {/* Accuracy tab */}
          {activeTab === 'accuracy' && (
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

          {/* Trend tab */}
          {activeTab === 'trend' && (
            <>
              {trendLoading && <LoadingSpinner message='' />}

              {trendError && (
                <div className='flex h-48 items-center justify-center text-sm text-red-500'>
                  {trendError}
                </div>
              )}

              {!trendLoading && !trendError && trend && !hasTrendActivity && (
                <p className='py-4 text-center text-sm text-gray-500 dark:text-gray-400'>
                  No recent answer activity.
                </p>
              )}

              {!trendLoading && !trendError && trend && hasTrendActivity && (
                <ResponsiveContainer width='100%' height={220}>
                  <ComposedChart data={[...trend]}>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke='currentColor'
                      className='opacity-10'
                    />
                    <XAxis
                      dataKey='date'
                      tick={{ fontSize: 10 }}
                      tickFormatter={formatShortDate}
                    />
                    <YAxis
                      yAxisId='left'
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId='right'
                      orientation='right'
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => `${v}%`}
                    />
                    <Tooltip
                      labelFormatter={value => formatShortDate(value as string)}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      yAxisId='left'
                      dataKey='practice_count'
                      fill='#6366f1'
                      name='Practices'
                      radius={[2, 2, 0, 0]}
                    />
                    <Line
                      yAxisId='right'
                      dataKey='accuracy_rate'
                      stroke='#3b82f6'
                      dot={false}
                      name='Accuracy %'
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </>
      )}
    </Modal>
  );
};
