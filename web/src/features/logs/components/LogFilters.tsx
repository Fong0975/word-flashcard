import React from 'react';

import { QuickFilterButton } from '../../words/QuickFilterButton';
import { LOG_LEVELS, LogLevel } from '../../../types/logs';
import { LOG_LEVEL_DOT_CLASSES } from '../constants';

interface LogFiltersProps {
  activeLevels: readonly string[];
  onToggleLevel: (level: LogLevel) => void;
  /** `YYYY-MM-DDTHH:mm`, the value an `<input type="datetime-local">` submits. */
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  keyword: string;
  onKeywordChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeywordCompositionStart: () => void;
  onKeywordCompositionEnd: (
    event: React.CompositionEvent<HTMLInputElement>,
  ) => void;
  onKeywordClear: () => void;
}

const dateInputClassName =
  'rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 ' +
  'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ' +
  'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200';

/** Level pills, keyword search and an inclusive datetime range for the log list. */
export const LogFilters: React.FC<LogFiltersProps> = ({
  activeLevels,
  onToggleLevel,
  from,
  to,
  onFromChange,
  onToChange,
  keyword,
  onKeywordChange,
  onKeywordCompositionStart,
  onKeywordCompositionEnd,
  onKeywordClear,
}) => (
  <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
    <div className='flex flex-wrap gap-1.5'>
      {LOG_LEVELS.map(level => (
        <QuickFilterButton
          key={level}
          label={level}
          isActive={activeLevels.includes(level)}
          onClick={() => onToggleLevel(level)}
          dotClassName={LOG_LEVEL_DOT_CLASSES[level]}
        />
      ))}
    </div>

    <div className='relative'>
      <input
        type='text'
        value={keyword}
        onChange={onKeywordChange}
        onCompositionStart={onKeywordCompositionStart}
        onCompositionEnd={onKeywordCompositionEnd}
        placeholder='Search message or source...'
        aria-label='Search logs'
        className={`w-48 pr-6 ${dateInputClassName}`}
      />
      {keyword && (
        <button
          type='button'
          onClick={onKeywordClear}
          aria-label='Clear search'
          className='absolute inset-y-0 right-1.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
        >
          <svg
            className='h-3 w-3'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='2'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      )}
    </div>

    <div className='flex items-center gap-1.5'>
      <label
        htmlFor='log-from'
        className='text-xs text-gray-500 dark:text-gray-400'
      >
        From
      </label>
      <input
        id='log-from'
        type='datetime-local'
        value={from}
        onChange={event => onFromChange(event.target.value)}
        className={dateInputClassName}
      />
      <label
        htmlFor='log-to'
        className='text-xs text-gray-500 dark:text-gray-400'
      >
        To
      </label>
      <input
        id='log-to'
        type='datetime-local'
        value={to}
        onChange={event => onToChange(event.target.value)}
        className={dateInputClassName}
      />
    </div>
  </div>
);
