import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SegmentedToggle } from '../../components/ui/SegmentedToggle';
import {
  CHART_TEXT_CLASSNAME,
  GLASS_BAR_STROKE,
  GLASS_BAR_STROKE_WIDTH,
  GLASS_FILL_OPACITY,
  GLASS_TOOLTIP_STYLE,
  glassLegendFormatter,
} from '../../components/ui/charts/chartGlassStyles';
import { GlassTooltipContent } from '../../components/ui/charts/GlassTooltipContent';
import { PracticeCountBarChart } from '../../components/ui/charts/PracticeCountBarChart';
import { apiService } from '../../lib/api';
import { WordStatsResponse, WordTrendPoint } from '../../types/api';
import { FamiliarityLevel } from '../../types/base';
import {
  FAMILIARITY_CHART_COLORS,
  FAMILIARITY_LABELS,
} from '../shared/constants/familiarity';
import { useAsyncOnOpen } from '../shared/hooks/useAsyncOnOpen';
import { formatShortDate } from '../../utils/dateFormat';

interface WordStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'familiarity' | 'practice' | 'trend';

const TABS: readonly { value: ActiveTab; label: string }[] = [
  { value: 'familiarity', label: 'Familiarity' },
  { value: 'practice', label: 'Practice Count' },
  { value: 'trend', label: 'Trend' },
];

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
        {
          level: FamiliarityLevel.RED,
          value: stats.familiarity_distribution.red,
        },
        {
          level: FamiliarityLevel.YELLOW,
          value: stats.familiarity_distribution.yellow,
        },
        {
          level: FamiliarityLevel.GREEN,
          value: stats.familiarity_distribution.green,
        },
      ].map(entry => ({ ...entry, name: FAMILIARITY_LABELS[entry.level] }))
    : [];

  const total = familiarityChartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Word Statistics'
      maxWidth='lg'
    >
      {loading && <LoadingSpinner message='' />}

      {error && (
        <div className='text-error flex h-48 items-center justify-center text-sm'>
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          {/* Tab toggle */}
          <SegmentedToggle
            options={TABS}
            value={activeTab}
            onChange={setActiveTab}
            className='mb-5'
          />

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
                        key={entry.level}
                        fill={FAMILIARITY_CHART_COLORS[entry.level]}
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
                  <div className='text-error text-xl font-bold'>
                    {stats.familiarity_distribution.red}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    {FAMILIARITY_LABELS[FamiliarityLevel.RED]}
                  </div>
                </div>
                <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
                  <div className='text-xl font-bold text-yellow-700 dark:text-yellow-400'>
                    {stats.familiarity_distribution.yellow}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    {FAMILIARITY_LABELS[FamiliarityLevel.YELLOW]}
                  </div>
                </div>
                <div className='rounded-lg bg-green-50 p-3 dark:bg-green-900/20'>
                  <div className='text-xl font-bold text-green-700 dark:text-green-400'>
                    {stats.familiarity_distribution.green}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    {FAMILIARITY_LABELS[FamiliarityLevel.GREEN]}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Practice Count tab */}
          {activeTab === 'practice' && (
            <PracticeCountBarChart
              data={stats.practice_count_distribution}
              total={total}
              entity='word'
            />
          )}

          {/* Trend tab */}
          {activeTab === 'trend' && (
            <>
              {trendLoading && <LoadingSpinner message='Loading trend...' />}

              {trendError && (
                <div className='text-error flex h-48 items-center justify-center text-sm'>
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
                      content={
                        <GlassTooltipContent labelFormatter={formatShortDate} />
                      }
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
                      connectNulls
                      stroke='#c084fc'
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      name='Improvement (%)'
                    />
                    <Line
                      yAxisId='right'
                      dataKey='avg_familiarity_score'
                      connectNulls
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
