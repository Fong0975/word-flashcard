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
import { SegmentedToggle } from '../../components/ui/SegmentedToggle';
import {
  CHART_TEXT_CLASSNAME,
  GLASS_BAR_STROKE,
  GLASS_BAR_STROKE_WIDTH,
  GLASS_FILL_OPACITY,
  GLASS_TOOLTIP_CLASSNAME,
  glassLegendFormatter,
} from '../../components/ui/charts/chartGlassStyles';
import { GlassTooltipContent } from '../../components/ui/charts/GlassTooltipContent';
import { PracticeCountBarChart } from '../../components/ui/charts/PracticeCountBarChart';
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
    <div className={GLASS_TOOLTIP_CLASSNAME}>
      <div>
        {range}: {count} questions
      </div>
      {breakdown.length > 0 && (
        <div className='mt-1 border-t border-white/10 pt-1'>
          <div className='text-supporting'>By practice count:</div>
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

type ActiveTab = 'accuracy' | 'practice' | 'trend';

const TABS: readonly { value: ActiveTab; label: string }[] = [
  { value: 'accuracy', label: 'Accuracy' },
  { value: 'practice', label: 'Practice Count' },
  { value: 'trend', label: 'Trend' },
];

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

          {/* Accuracy tab */}
          {activeTab === 'accuracy' && (
            <>
              <p className='mb-4 text-sm text-gray-500 dark:text-gray-400'>
                Accuracy distribution — {total} questions total
              </p>
              <ResponsiveContainer
                width='100%'
                height={260}
                className={CHART_TEXT_CLASSNAME}
              >
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                >
                  <XAxis
                    dataKey='range'
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    interval={0}
                    angle={-35}
                    textAnchor='end'
                    height={52}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey='count' radius={[3, 3, 0, 0]}>
                    {chartData.map(entry => (
                      <Cell
                        key={entry.range}
                        fill={getBarColor(entry.range)}
                        fillOpacity={GLASS_FILL_OPACITY}
                        stroke={GLASS_BAR_STROKE}
                        strokeWidth={GLASS_BAR_STROKE_WIDTH}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className='mt-2 flex justify-center gap-6 text-xs text-gray-500 dark:text-gray-400'>
                <span className='flex items-center gap-1'>
                  <span className='inline-block h-2.5 w-2.5 rounded-xs border border-white/50 bg-green-500/80 shadow-xs'></span>
                  80–100%
                </span>
                <span className='flex items-center gap-1'>
                  <span className='inline-block h-2.5 w-2.5 rounded-xs border border-white/50 bg-yellow-400/80 shadow-xs'></span>
                  50–79%
                </span>
                <span className='flex items-center gap-1'>
                  <span className='inline-block h-2.5 w-2.5 rounded-xs border border-white/50 bg-red-500/80 shadow-xs'></span>
                  0–49%
                </span>
                <span className='flex items-center gap-1'>
                  <span className='inline-block h-2.5 w-2.5 rounded-xs border border-white/50 bg-gray-400/80 shadow-xs'></span>
                  N/A
                </span>
              </div>
            </>
          )}

          {/* Practice Count tab */}
          {activeTab === 'practice' && (
            <PracticeCountBarChart
              data={stats.practice_count_distribution}
              total={total}
              entity='question'
            />
          )}

          {/* Trend tab */}
          {activeTab === 'trend' && (
            <>
              {trendLoading && <LoadingSpinner message='' />}

              {trendError && (
                <div className='text-error flex h-48 items-center justify-center text-sm'>
                  {trendError}
                </div>
              )}

              {!trendLoading && !trendError && trend && !hasTrendActivity && (
                <p className='py-4 text-center text-sm text-gray-500 dark:text-gray-400'>
                  No recent answer activity.
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
                      dataKey='accuracy_rate'
                      connectNulls
                      stroke='#38bdf8'
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      name='Accuracy (%)'
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
