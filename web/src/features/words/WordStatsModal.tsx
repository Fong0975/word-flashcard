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
import {
  CHART_TEXT_CLASSNAME,
  GLASS_BAR_STROKE,
  GLASS_BAR_STROKE_WIDTH,
  GLASS_FILL_OPACITY,
  GLASS_TOOLTIP_STYLE,
  glassLegendFormatter,
} from '../../components/ui/charts/chartGlassStyles';
import { apiService } from '../../lib/api';
import { WordStatsResponse, WordTrendPoint } from '../../types/api';
import { useAsyncOnOpen } from '../shared/hooks/useAsyncOnOpen';
import { formatShortDate } from '../../utils/dateFormat';

interface WordStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'familiarity' | 'practice' | 'trend';

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
            <div className='glass-panel flex overflow-hidden rounded-md text-sm'>
              <button
                type='button'
                onClick={() => setActiveTab('familiarity')}
                className={`rounded-l-md px-4 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                  activeTab === 'familiarity'
                    ? 'glass-button-primary'
                    : 'glass-interactive text-gray-600 dark:text-gray-300'
                }`}
              >
                Familiarity
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('practice')}
                className={`border-l border-white/30 px-4 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 dark:border-white/10 ${
                  activeTab === 'practice'
                    ? 'glass-button-primary'
                    : 'glass-interactive text-gray-600 dark:text-gray-300'
                }`}
              >
                Practice Count
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('trend')}
                className={`rounded-r-md border-l border-white/30 px-4 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 dark:border-white/10 ${
                  activeTab === 'trend'
                    ? 'glass-button-primary'
                    : 'glass-interactive text-gray-600 dark:text-gray-300'
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
              <ResponsiveContainer
                width='100%'
                height={280}
                className={CHART_TEXT_CLASSNAME}
              >
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
                        fillOpacity={GLASS_FILL_OPACITY}
                        stroke={GLASS_BAR_STROKE}
                        strokeWidth={GLASS_BAR_STROKE_WIDTH}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} words`, name]}
                    contentStyle={GLASS_TOOLTIP_STYLE}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={glassLegendFormatter}
                  />
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
              <ResponsiveContainer
                width='100%'
                height={280}
                className={CHART_TEXT_CLASSNAME}
              >
                <BarChart
                  data={practiceChartData}
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
                    formatter={(value, _name) => [`${value} words`, 'Count']}
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
                <ResponsiveContainer
                  width='100%'
                  height={280}
                  className={CHART_TEXT_CLASSNAME}
                >
                  <ComposedChart
                    data={[...trend]}
                    margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke='currentColor'
                      className='opacity-10'
                    />
                    <XAxis
                      dataKey='date'
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      tickFormatter={formatShortDate}
                    />
                    <YAxis
                      yAxisId='left'
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                    />
                    <YAxis
                      yAxisId='right'
                      orientation='right'
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      tickFormatter={v => `${v}%`}
                    />
                    <Tooltip
                      labelFormatter={value => formatShortDate(value as string)}
                      contentStyle={GLASS_TOOLTIP_STYLE}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={glassLegendFormatter}
                    />
                    <Bar
                      yAxisId='left'
                      dataKey='practice_count'
                      fill='#4338ca'
                      fillOpacity={GLASS_FILL_OPACITY}
                      stroke={GLASS_BAR_STROKE}
                      strokeWidth={GLASS_BAR_STROKE_WIDTH}
                      name='Practices'
                      radius={[2, 2, 0, 0]}
                    />
                    <Line
                      yAxisId='right'
                      dataKey='improvement_rate'
                      stroke='#c084fc'
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      name='Improvement (%)'
                    />
                    <Line
                      yAxisId='right'
                      dataKey='avg_familiarity_score'
                      stroke='#38bdf8'
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      name='Avg Familiarity (%)'
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
