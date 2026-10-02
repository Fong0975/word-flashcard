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
const inputBaseClassName = 'glass-input text-xs';

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
  <div className='rounded-lg border border-black/10 p-3 dark:border-white/10'>
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
            className='focus-ring absolute inset-y-0 right-2 flex items-center rounded-md text-gray-400 hover:text-gray-600 focus-visible:text-gray-600 dark:hover:text-gray-200 dark:focus-visible:text-gray-200'
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

      {/* A single flex-wrap item so the pair wraps together onto its own line
          on a narrow phone screen, rather than overflowing the card. */}
      <div className='flex flex-wrap items-center gap-1.5'>
        <input
          id='log-from'
          type='datetime-local'
          aria-label='From'
          value={from}
          onChange={event => onFromChange(event.target.value)}
          className={`w-40 max-w-full ${dateInputClassName}`}
        />
        <span className='text-xs text-gray-500 dark:text-gray-400'>~</span>
        <input
          id='log-to'
          type='datetime-local'
          aria-label='To'
          value={to}
          onChange={event => onToChange(event.target.value)}
          className={`w-40 max-w-full ${dateInputClassName}`}
        />
      </div>
    </div>
  </div>
);
