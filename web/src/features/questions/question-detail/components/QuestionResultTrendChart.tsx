import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import {
  CHART_ACTIVE_DOT_RADIUS,
  CHART_AXIS_TICK_MARGIN,
  CHART_TEXT_CLASSNAME,
  CHART_X_AXIS_HEIGHT,
  GLASS_TOOLTIP_STYLE,
} from '../../../../components/ui/charts/chartGlassStyles';
import { GlassDot } from '../../../../components/ui/charts/GlassDot';
import { QuestionAnswerLogEntry } from '../../../../types/api';
import { formatDateTime, formatShortDate } from '../../../../utils/dateFormat';

/** Chart colors of an answer outcome, shared by every answer history chart. */
export const ANSWER_RESULT_COLORS = {
  correct: '#22c55e',
  incorrect: '#ef4444',
} as const;

/** Y-axis position of an incorrect and a correct answer. */
const INCORRECT_VALUE = 0;
const CORRECT_VALUE = 1;

/** Tick labels, indexed by the y-axis value. */
const RESULT_LABELS = ['Incorrect', 'Correct'];

/**
 * Wide enough for the longest result label at the 11px tick font size, plus
 * the extra tick margin.
 */
const Y_AXIS_WIDTH = 72;

export interface ResultTrendPoint {
  index: number;
  result: number;
  created_at: string;
}

/**
 * Build the line chart points in chronological order.
 *
 * @param entries - Answer log entries, newest first
 * @returns One point per entry, oldest first
 */
export const buildResultTrendData = (
  entries: readonly QuestionAnswerLogEntry[],
): ResultTrendPoint[] =>
  [...entries].reverse().map((entry, index) => ({
    index,
    result: entry.is_correct ? CORRECT_VALUE : INCORRECT_VALUE,
    created_at: entry.created_at,
  }));

interface ResultDotProps {
  cx?: number;
  cy?: number;
  payload?: { result: number };
  /** Named `radius` because recharts overwrites `r` when cloning the element. */
  radius?: number;
}

/**
 * Line chart data point filled green for a correct answer and red for an
 * incorrect one. recharts injects `cx`, `cy` and `payload` when it clones the
 * element passed to `dot` / `activeDot`.
 *
 * @returns The dot, or `null` when recharts has no data for the point
 */
export const ResultDot: React.FC<ResultDotProps> = ({
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
      fill={
        payload.result === CORRECT_VALUE
          ? ANSWER_RESULT_COLORS.correct
          : ANSWER_RESULT_COLORS.incorrect
      }
    />
  );
};

interface QuestionResultTrendChartProps {
  /** Answer log entries, newest first. */
  entries: readonly QuestionAnswerLogEntry[];
}

/**
 * Line chart of whether each recent answer was correct or incorrect, in
 * chronological order.
 */
export const QuestionResultTrendChart: React.FC<
  QuestionResultTrendChartProps
> = ({ entries }) => {
  const chartData = buildResultTrendData(entries);

  return (
    <ResponsiveContainer
      width='100%'
      height={160}
      className={CHART_TEXT_CLASSNAME}
    >
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
          tickFormatter={i =>
            chartData[i] ? formatShortDate(chartData[i].created_at) : ''
          }
        />
        <YAxis
          width={Y_AXIS_WIDTH}
          axisLine={false}
          tickLine={false}
          tickMargin={CHART_AXIS_TICK_MARGIN}
          domain={[INCORRECT_VALUE, CORRECT_VALUE]}
          ticks={[INCORRECT_VALUE, CORRECT_VALUE]}
          tick={{ fontSize: 11, fill: 'currentColor' }}
          tickFormatter={v => RESULT_LABELS[v as number]}
        />
        <Tooltip
          formatter={value => [RESULT_LABELS[value as number], 'Result']}
          labelFormatter={i =>
            chartData[i as number]
              ? formatDateTime(chartData[i as number].created_at)
              : ''
          }
          contentStyle={GLASS_TOOLTIP_STYLE}
        />
        <Line
          type='linear'
          dataKey='result'
          stroke='currentColor'
          dot={<ResultDot />}
          activeDot={<ResultDot radius={CHART_ACTIVE_DOT_RADIUS} />}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
