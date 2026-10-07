import React from 'react';

import { WordQuizResult } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';
import {
  FAMILIARITY_LABELS,
  getFamiliarityDisplayColors,
  getFamiliarityLabel,
} from '../../shared/constants/familiarity';

interface WordQuizResultsProps {
  results: WordQuizResult[];
}

const FamiliarityBadge: React.FC<{ familiarity: string }> = ({
  familiarity,
}) => {
  const colors = getFamiliarityDisplayColors(familiarity);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <div className={`h-2 w-2 ${colors.dot} mr-1 rounded-full`}></div>
      {getFamiliarityLabel(familiarity)}
    </span>
  );
};

interface SummaryStatProps {
  /** Name of the stat, shown in the hover tooltip (e.g. `Improved`). */
  label: string;
  count: number;
  /** Accessible name of the count element. */
  countLabel: string;
  /** Text color shared by the arrow and the count. */
  colorClassName: string;
  /** Arrow glyph shown before the count; omit to show a dot instead. */
  arrow?: string;
  /** Fill of the dot shown when there is no `arrow`. */
  dotClassName?: string;
}

/**
 * One block of the quiz summary: a marker (dot or arrow) and a count, with a
 * short tooltip such as `Improved: 6 words` explaining what the count means.
 */
const SummaryStat: React.FC<SummaryStatProps> = ({
  label,
  count,
  countLabel,
  colorClassName,
  arrow,
  dotClassName,
}) => (
  <span
    className={`glass-panel-card flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 ${colorClassName}`}
    title={`${label}: ${count} ${count === 1 ? 'word' : 'words'}`}
  >
    {arrow ? (
      <span className='text-base font-bold'>{arrow}</span>
    ) : (
      <span
        className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dotClassName}`}
      ></span>
    )}
    <span aria-label={countLabel} className='text-lg font-bold'>
      {count}
    </span>
  </span>
);

const STAT_COLORS = {
  red: 'text-red-700 dark:text-red-300',
  yellow: 'text-yellow-700 dark:text-yellow-300',
  green: 'text-green-700 dark:text-green-300',
} as const;

export const WordQuizResults: React.FC<WordQuizResultsProps> = ({
  results,
}) => {
  const totalQuestions = results.length;
  const levels: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  const {
    improvementCount,
    stayCount,
    worsenedCount,
    redCount,
    yellowCount,
    greenCount,
  } = results.reduce(
    (acc, result) => {
      const oldLevel = levels[result.oldFamiliarity];
      const newLevel = levels[result.newFamiliarity];

      if (newLevel > oldLevel) {
        acc.improvementCount++;
      } else if (newLevel === oldLevel) {
        acc.stayCount++;
      } else {
        acc.worsenedCount++;
      }

      if (result.newFamiliarity === 'red') {
        acc.redCount++;
      } else if (result.newFamiliarity === 'yellow') {
        acc.yellowCount++;
      } else if (result.newFamiliarity === 'green') {
        acc.greenCount++;
      }

      return acc;
    },
    {
      improvementCount: 0,
      stayCount: 0,
      worsenedCount: 0,
      redCount: 0,
      yellowCount: 0,
      greenCount: 0,
    },
  );

  const summaryRows: { heading: string; stats: SummaryStatProps[] }[] = [
    {
      heading: 'After',
      stats: [
        { level: FamiliarityLevel.RED, count: redCount },
        { level: FamiliarityLevel.YELLOW, count: yellowCount },
        { level: FamiliarityLevel.GREEN, count: greenCount },
      ].map(({ level, count }) => ({
        label: FAMILIARITY_LABELS[level],
        count,
        countLabel: `${FAMILIARITY_LABELS[level]} count`,
        colorClassName: STAT_COLORS[level],
        dotClassName: getFamiliarityDisplayColors(level).dot,
      })),
    },
    {
      heading: 'Change',
      stats: [
        {
          label: 'Improved',
          count: improvementCount,
          countLabel: 'improvement count',
          colorClassName: STAT_COLORS.green,
          arrow: '↑',
        },
        {
          label: 'Unchanged',
          count: stayCount,
          countLabel: 'stay count',
          colorClassName: STAT_COLORS.yellow,
          arrow: '→',
        },
        {
          label: 'Worsened',
          count: worsenedCount,
          countLabel: 'worsened count',
          colorClassName: STAT_COLORS.red,
          arrow: '↓',
        },
      ],
    },
  ];

  return (
    <div className='mx-auto max-w-4xl pt-8'>
      {/* Header */}
      <div className='mb-8 text-center'>
        <div className='mb-4 text-6xl'>🎉</div>
        <h1 className='mb-2 text-xl font-bold text-gray-900 dark:text-white lg:text-3xl'>
          Quiz Complete!
        </h1>
        <p className='text-gray-600 dark:text-gray-300 lg:text-lg'>
          Great job! Here&apos;s a summary of your quiz results.
        </p>
      </div>

      {/* Summary */}
      <div className='glass-panel mb-8 mt-4 grid grid-cols-1 gap-4 rounded-xl p-8'>
        {/* Total Number */}
        <div className='text-center text-6xl font-bold text-gray-700 dark:text-gray-200'>
          {totalQuestions}
        </div>

        {summaryRows.map(row => (
          <div
            key={row.heading}
            className='flex items-center gap-4 border-t border-gray-200 pt-4 dark:border-gray-700'
          >
            <span className='text-supporting w-16 flex-shrink-0 text-right text-xs font-medium uppercase tracking-wide'>
              {row.heading}
            </span>
            <div className='flex flex-1 gap-2'>
              {row.stats.map(stat => (
                <SummaryStat key={stat.countLabel} {...stat} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Results List */}
      <div className='glass-panel mb-8 rounded-lg'>
        <div className='border-b border-gray-200 px-6 py-4 dark:border-gray-700'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
            Quiz Results ({totalQuestions} words)
          </h2>
        </div>

        <div className='divide-y divide-gray-200 dark:divide-gray-700'>
          {/* Quiz Result - Word List */}
          {results.map((result, index) => (
            <div key={result.word.id} className='px-2 py-4 md:px-3 lg:px-6'>
              <div className='flex items-center justify-between gap-4'>
                <div className='flex min-w-0 items-center space-x-4'>
                  <div className='flex-shrink-0'>
                    <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400 md:h-10 md:w-10'>
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                      {result.word.word}
                    </h3>
                    {result.word.definitions &&
                      result.word.definitions.length > 0 && (
                        <p className='mt-1 text-sm text-gray-600 dark:text-gray-300'>
                          {result.word.definitions[0].definition}
                        </p>
                      )}
                  </div>
                </div>

                <div className='flex flex-shrink-0 flex-col items-center space-y-2'>
                  <FamiliarityBadge familiarity={result.oldFamiliarity} />

                  <div className='text-supporting'>to</div>

                  <FamiliarityBadge familiarity={result.newFamiliarity} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
