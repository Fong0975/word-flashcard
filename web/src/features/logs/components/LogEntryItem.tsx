import React, { useState } from 'react';

import { LogEntry } from '../../../types/logs';
import { LOG_LEVEL_BADGE_CLASSES } from '../constants';
import { formatLogTimestamp } from '../utils/formatLogTimestamp';

interface LogEntryItemProps {
  entry: LogEntry;
}

/**
 * One log record.
 *
 * Multi-line messages -- panic stack traces, which the backend folds into a
 * single entry -- are collapsed to their first line so a single panic cannot
 * push the rest of the page off screen.
 */
export const LogEntryItem: React.FC<LogEntryItemProps> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);

  const newlineIndex = entry.message.indexOf('\n');
  const isMultiline = newlineIndex !== -1;
  const firstLine = isMultiline
    ? entry.message.slice(0, newlineIndex)
    : entry.message;

  return (
    <li className='border-b border-gray-100 py-2 last:border-b-0 dark:border-gray-700'>
      <div className='flex flex-wrap items-baseline gap-x-2 gap-y-1'>
        <span className='font-mono text-xs text-gray-500 dark:text-gray-400'>
          {formatLogTimestamp(entry.timestamp)}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${LOG_LEVEL_BADGE_CLASSES[entry.level]}`}
        >
          {entry.level}
        </span>
        <span className='font-mono text-xs text-gray-400 dark:text-gray-500'>
          {entry.source}
        </span>
      </div>

      <pre className='mt-1 whitespace-pre-wrap break-words font-mono text-xs text-gray-800 dark:text-gray-200'>
        {expanded ? entry.message : firstLine}
      </pre>

      {isMultiline && (
        <button
          type='button'
          onClick={() => setExpanded(previous => !previous)}
          className='mt-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400'
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </li>
  );
};
