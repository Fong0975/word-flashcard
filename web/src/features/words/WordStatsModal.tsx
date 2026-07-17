import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiService } from '../../lib/api';
import { WordStatsResponse, WordTrendPoint } from '../../types/api';
import { useAsyncOnOpen } from '../shared/hooks/useAsyncOnOpen';

interface WordStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'familiarity' | 'practice' | 'trend';

// Only invoked by recharts' tickFormatter/labelFormatter props below, which
// recharts never calls under jsdom (ResponsiveContainer measures 0x0 there).
/* istanbul ignore next */
const formatShortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString();

const FAMILIARITY_COLORS = {
  Unfamiliar: '#ef4444',
  'Somewhat Familiar': '#eab308',
  Familiar: '#22c55e',
};

export const WordStatsModal: React.FC<WordStatsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('familiarity');

  const {
    data: stats,
    loading,
    error,
  } = useAsyncOnOpen<WordStatsResponse>({
    isOpen,
    fetcher: () => apiService.getWordStats(),
    errorMessage: 'Failed to load word statistics.',
  });

  const {
    data: trend,
    loading: trendLoading,
    error: trendError,
  } = useAsyncOnOpen<WordTrendPoint[]>({
    isOpen,
    fetcher: () => apiService.getWordsTrend(30),
    errorMessage: 'Failed to load practice trend.',
  });

  const hasTrendActivity = trend
    ? trend.some(point => point.practice_count > 0)
    : false;

  const familiarityChartData = stats
    ? [
        { name: 'Unfamiliar', value: stats.familiarity_distribution.red },
        {
          name: 'Somewhat Familiar',
          value: stats.familiarity_distribution.yellow,
        },
        { name: 'Familiar', value: stats.familiarity_distribution.green },
      ]
    : [];

  const total = familiarityChartData.reduce((sum, d) => sum + d.value, 0);

  const practiceChartData = stats ? [...stats.practice_count_distribution] : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Word Statistics'
      maxWidth='md'
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
                onClick={() => setActiveTab('familiarity')}
                className={`rounded-l-md px-4 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  activeTab === 'familiarity'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Familiarity
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('practice')}
                className={`border-l border-gray-300 px-4 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-gray-600 ${
                  activeTab === 'practice'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Practice Count
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

          {/* Familiarity tab */}
          {activeTab === 'familiarity' && (
            <>
              <p className='mb-4 text-sm text-gray-500 dark:text-gray-400'>
                Familiarity distribution — {total} words total
              </p>
              <ResponsiveContainer width='100%' height={280}>
                <PieChart>
                  <Pie
                    data={familiarityChartData}
                    cx='50%'
                    cy='43%'
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey='value'
                    label={({ percent }) =>
                      (percent ?? 0) > 0
                        ? `${((percent ?? 0) * 100).toFixed(0)}%`
                        : ''
                    }
                    labelLine={true}
                  >
                    {familiarityChartData.map(entry => (
                      <Cell
                        key={entry.name}
                        fill={
                          FAMILIARITY_COLORS[
                            entry.name as keyof typeof FAMILIARITY_COLORS
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} words`, name]}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>

              <div className='mt-4 grid grid-cols-3 gap-3 text-center'>
                <div className='rounded-lg bg-red-50 p-3 dark:bg-red-900/20'>
                  <div className='text-xl font-bold text-red-500'>
                    {stats.familiarity_distribution.red}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    Unfamiliar
                  </div>
                </div>
                <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
                  <div className='text-xl font-bold text-yellow-500'>
                    {stats.familiarity_distribution.yellow}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    Somewhat Familiar
                  </div>
                </div>
                <div className='rounded-lg bg-green-50 p-3 dark:bg-green-900/20'>
                  <div className='text-xl font-bold text-green-500'>
                    {stats.familiarity_distribution.green}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    Familiar
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Practice Count tab */}
          {activeTab === 'practice' && (
            <>
              <p className='mb-4 text-sm text-gray-500 dark:text-gray-400'>
                Practice count distribution — {total} words total
              </p>
              <ResponsiveContainer width='100%' height={280}>
                <BarChart
                  data={practiceChartData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='currentColor'
                    className='opacity-10'
                  />
                  <XAxis dataKey='range' tick={{ fontSize: 11 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value, _name) => [`${value} words`, 'Count']}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey='count' radius={[3, 3, 0, 0]} fill='#6366f1' />
                </BarChart>
              </ResponsiveContainer>
              <p className='mt-2 text-center text-xs text-gray-400 dark:text-gray-500'>
                Times practiced (per word)
              </p>
            </>
          )}

          {/* Trend tab */}
          {activeTab === 'trend' && (
            <>
              {trendLoading && <LoadingSpinner message='Loading trend...' />}

              {trendError && (
                <div className='flex h-48 items-center justify-center text-sm text-red-500'>
                  {trendError}
                </div>
              )}

              {!trendLoading && !trendError && trend && !hasTrendActivity && (
                <p className='py-4 text-center text-sm text-gray-500 dark:text-gray-400'>
                  No recent practice activity.
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
                      dataKey='improvement_rate'
                      stroke='#22c55e'
                      dot={false}
                      name='Improvement %'
                    />
                    <Line
                      yAxisId='right'
                      dataKey='avg_familiarity_score'
                      stroke='#3b82f6'
                      dot={false}
                      name='Avg Familiarity %'
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
