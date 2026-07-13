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
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { apiService } from '../../../../lib/api';
import { Question, QuestionAnswerLogEntry } from '../../../../types/api';
import { useAsyncOnOpen } from '../../../shared/hooks/useAsyncOnOpen';

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

const formatDateTime = (iso: string): string => new Date(iso).toLocaleString();

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

  return (
    <CollapsibleSection
      title='Recent Answer History'
      isOpen={isOpen}
      onToggle={() => setIsOpen(open => !open)}
    >
      {loading && <LoadingSpinner message='Loading history...' />}

      {error && (
        <div className='py-4 text-center text-sm text-red-500'>{error}</div>
      )}

      {!loading && !error && entries && entries.length === 0 && (
        <p className='py-4 text-center text-sm text-gray-500 dark:text-gray-400'>
          No answer history yet.
        </p>
      )}

      {!loading && !error && entries && entries.length > 0 && (
        <>
          <ResponsiveContainer width='100%' height={200}>
            <BarChart data={optionCounts}>
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='currentColor'
                className='opacity-10'
              />
              <XAxis dataKey='option' tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey='correct'
                stackId='a'
                fill='#22c55e'
                name='Correct'
              />
              <Bar
                dataKey='incorrect'
                stackId='a'
                fill='#ef4444'
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
                <span className='text-gray-500 dark:text-gray-400'>
                  {formatDateTime(entry.created_at)}
                </span>
                <span className='font-medium text-gray-700 dark:text-gray-300'>
                  Option {entry.selected_option}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
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
