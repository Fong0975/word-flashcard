import React from 'react';

import { Tooltip } from '../../components/ui';
import { BackupFile, BackupSummary } from '../../types/backups';

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];

interface FileSizeParts {
  value: string;
  unit: string;
}

/**
 * Formats a byte count as a human-readable size, split into its number and
 * unit (e.g. `{ value: "482.0", unit: "KB" }`) so the two can be styled apart.
 */
const formatFileSize = (bytes: number): FileSizeParts => {
  if (bytes < 1024) {
    return { value: `${bytes}`, unit: SIZE_UNITS[0] };
  }

  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return { value: value.toFixed(1), unit: SIZE_UNITS[unitIndex] };
};

const pluralize = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

/** Formats a summary as e.g. `3 words · 1 question · 0 notes`. */
const formatSummary = (summary: BackupSummary): string =>
  [
    pluralize(summary.words, 'word'),
    pluralize(summary.questions, 'question'),
    pluralize(summary.notes, 'note'),
  ].join(' · ');

const ICON_CLASS_NAME = 'h-4 w-4 shrink-0';

/**
 * Size value of a backup file, preceded by an info icon whose tooltip lists
 * how many words, questions and notes the backup holds. Backups created
 * before the counts were recorded have no summary; they get an empty
 * placeholder of the same width so the sizes stay aligned in the column.
 */
export const BackupSizeCell: React.FC<{ backup: BackupFile }> = ({
  backup,
}) => {
  const size = formatFileSize(backup.size_bytes);

  return (
    <span className='inline-flex items-center gap-1.5'>
      {backup.summary ? (
        <Tooltip
          label='Backup contents'
          content={formatSummary(backup.summary)}
        >
          <svg
            viewBox='0 0 24 24'
            className={ICON_CLASS_NAME}
            fill='none'
            stroke='currentColor'
            strokeWidth={1.5}
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'
            />
          </svg>
        </Tooltip>
      ) : (
        <span className={ICON_CLASS_NAME} aria-hidden='true' />
      )}
      <span>
        {size.value} <span className='text-xs'>{size.unit}</span>
      </span>
    </span>
  );
};
