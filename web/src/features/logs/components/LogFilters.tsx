import React from 'react';

import { QuickFilterButton } from '../../words/QuickFilterButton';
import { LOG_LEVELS, LogLevel } from '../../../types/logs';
import { LOG_LEVEL_DOT_CLASSES } from '../constants';

interface LogFiltersProps {
  activeLevels: readonly string[];
  onToggleLevel: (level: LogLevel) => void;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

const dateInputClassName =
  'rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 ' +
  'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ' +
  'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200';

/** Level pills plus an inclusive date range for the log list. */
export const LogFilters: React.FC<LogFiltersProps> = ({
  activeLevels,
  onToggleLevel,
  from,
  to,
  onFromChange,
  onToChange,
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

    <div className='flex items-center gap-1.5'>
      <label
        htmlFor='log-from'
        className='text-xs text-gray-500 dark:text-gray-400'
      >
        From
      </label>
      <input
        id='log-from'
        type='date'
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
        type='date'
        value={to}
        onChange={event => onToChange(event.target.value)}
        className={dateInputClassName}
      />
    </div>
  </div>
);
