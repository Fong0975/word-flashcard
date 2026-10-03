import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import {
  CHART_TEXT_CLASSNAME,
  GLASS_BAR_STROKE,
  GLASS_BAR_STROKE_WIDTH,
  GLASS_FILL_OPACITY,
  GLASS_TOOLTIP_STYLE,
  glassLegendFormatter,
} from '../../../../components/ui/charts/chartGlassStyles';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { apiService } from '../../../../lib/api';
import { Question, QuestionAnswerLogEntry } from '../../../../types/api';
import { useAsyncOnOpen } from '../../../shared/hooks/useAsyncOnOpen';
import { formatDateTime } from '../../../../utils/dateFormat';

interface QuestionHistorySectionProps {
  question: Question;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;
type OptionLetter = (typeof OPTION_LETTERS)[number];

/** Returns the option letters that actually have content on this question. */
const getAvailableOptions = (question: Question): OptionLetter[] => {
  return OPTION_LETTERS.filter(opt => {
    switch (opt) {
      case 'A':
        return Boolean(question.option_a);
      case 'B':
        return Boolean(question.option_b);
      case 'C':
        return Boolean(question.option_c);
      case 'D':
        return Boolean(question.option_d);
      default:
        return false;
    }
  });
};

/** Returns the text of the given option, or an empty string when the question has none. */
const getOptionText = (question: Question, option: string): string => {
  switch (option) {
    case 'A':
      return question.option_a ?? '';
    case 'B':
      return question.option_b ?? '';
    case 'C':
      return question.option_c ?? '';
    case 'D':
      return question.option_d ?? '';
    default:
      return '';
  }
};

/** Formats an option as `(A) text`, or just `(A)` when the option has no text. */
const formatOptionLabel = (question: Question, option: string): string => {
  const text = getOptionText(question, option);
  return text ? `(${option}) ${text}` : `(${option})`;
};

const MAX_TICK_TEXT_LENGTH = 12;

const truncateText = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

interface OptionTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
  optionTexts: Readonly<Record<string, string>>;
}

/** X-axis tick showing the option letter with a truncated option text beneath it. */
const OptionTick: React.FC<OptionTickProps> = ({
  x = 0,
  y = 0,
  payload,
  optionTexts,
}) => {
  const letter = payload?.value ?? '';
  const text = truncateText(optionTexts[letter] ?? '', MAX_TICK_TEXT_LENGTH);
  return (
    <text x={x} y={y} textAnchor='middle' fill='currentColor' fontSize={11}>
      <tspan x={x} dy='0.9em' fontWeight={600}>
        {letter}
      </tspan>
      {text && (
        <tspan x={x} dy='1.3em'>
          {text}
        </tspan>
      )}
    </text>
  );
};

interface OptionCount {
  option: string;
  correct: number;
  incorrect: number;
}

const buildOptionCounts = (
  options: readonly OptionLetter[],
  entries: readonly QuestionAnswerLogEntry[],
): OptionCount[] => {
  return options.map(option => ({
    option,
    correct: entries.filter(e => e.selected_option === option && e.is_correct)
      .length,
    incorrect: entries.filter(
      e => e.selected_option === option && !e.is_correct,
    ).length,
  }));
};

export const QuestionHistorySection: React.FC<QuestionHistorySectionProps> = ({
  question,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    data: entries,
    loading,
    error,
  } = useAsyncOnOpen<QuestionAnswerLogEntry[]>({
    isOpen,
    fetcher: () => apiService.getQuestionLogs(question.id, 15),
    errorMessage: 'Failed to load answer history.',
  });

  const options = getAvailableOptions(question);
  const optionCounts = entries ? buildOptionCounts(options, entries) : [];
  const optionTexts = Object.fromEntries(
    options.map(opt => [opt, getOptionText(question, opt)]),
  );

  return (
    <CollapsibleSection
      title='Recent Answer History'
      isOpen={isOpen}
      onToggle={() => setIsOpen(open => !open)}
    >
      {loading && <LoadingSpinner message='Loading history...' />}

      {error && (
        <div className='text-error py-4 text-center text-sm'>{error}</div>
      )}

      {!loading && !error && entries && entries.length === 0 && (
        <p className='py-4 text-center text-sm text-gray-500 dark:text-gray-400'>
          No answer history yet.
        </p>
      )}

      {!loading && !error && entries && entries.length > 0 && (
        <>
          <ResponsiveContainer
            width='100%'
            height={230}
            className={CHART_TEXT_CLASSNAME}
          >
            <BarChart
              data={optionCounts}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='currentColor'
                className='opacity-10'
              />
              <XAxis
                dataKey='option'
                height={50}
                interval={0}
                tick={<OptionTick optionTexts={optionTexts} />}
              />
              <YAxis
                width={30}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={GLASS_TOOLTIP_STYLE}
                labelFormatter={label =>
                  formatOptionLabel(question, String(label))
                }
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={glassLegendFormatter}
              />
              <Bar
                dataKey='correct'
                stackId='a'
                fill='#22c55e'
                fillOpacity={GLASS_FILL_OPACITY}
                stroke={GLASS_BAR_STROKE}
                strokeWidth={GLASS_BAR_STROKE_WIDTH}
                name='Correct'
              />
              <Bar
                dataKey='incorrect'
                stackId='a'
                fill='#ef4444'
                fillOpacity={GLASS_FILL_OPACITY}
                stroke={GLASS_BAR_STROKE}
                strokeWidth={GLASS_BAR_STROKE_WIDTH}
                name='Incorrect'
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <ul className='mt-4 space-y-2'>
            {entries.map(entry => (
              <li
                key={entry.id}
                className='flex items-center justify-between gap-2 text-sm'
              >
                <span className='min-w-0 flex-1 break-words text-gray-500 dark:text-gray-400'>
                  {formatDateTime(entry.created_at)}
                </span>
                <span className='min-w-0 flex-1 break-words font-medium text-gray-700 dark:text-gray-300'>
                  {formatOptionLabel(question, entry.selected_option)}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                    entry.is_correct
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}
                >
                  {entry.is_correct ? 'Correct' : 'Incorrect'}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </CollapsibleSection>
  );
};
