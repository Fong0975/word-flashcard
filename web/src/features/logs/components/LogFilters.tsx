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

// Padding is left out here (and applied per input below) so the search box
// can carry its own, more generous padding without a conflicting padding
// class from this shared base -- Tailwind utilities have equal specificity,
// so whichever one the build happens to emit last would otherwise silently
// win.
const inputBaseClassName =
  'rounded-md border border-gray-300 bg-white text-xs text-gray-700 ' +
  'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ' +
  'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200';

const dateInputClassName = `px-2 py-1 ${inputBaseClassName}`;

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

    {/* Always full width, so in a flex-wrap row this item never has room to
        share a line with the level pills -- it drops to its own line on
        every breakpoint instead of only when space happens to run out. */}
    <div className='relative w-full'>
      <input
        type='text'
        value={keyword}
        onChange={onKeywordChange}
        onCompositionStart={onKeywordCompositionStart}
        onCompositionEnd={onKeywordCompositionEnd}
        placeholder='Search message or source...'
        aria-label='Search logs'
        className={`w-full py-1.5 pl-3 pr-8 ${inputBaseClassName}`}
      />
      {keyword && (
        <button
          type='button'
          onClick={onKeywordClear}
          aria-label='Clear search'
          className='absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
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

    {/* From and To are separate flex items (rather than one group) so they
        can wrap onto their own lines independently -- bundled together, a
        narrow phone screen has no room to fit both native datetime-local
        controls on one line, and with nothing to wrap around they'd instead
        overflow the card. */}
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
        className={`w-40 max-w-full ${dateInputClassName}`}
      />
    </div>
    <div className='flex items-center gap-1.5'>
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
        className={`w-40 max-w-full ${dateInputClassName}`}
      />
    </div>
  </div>
);
