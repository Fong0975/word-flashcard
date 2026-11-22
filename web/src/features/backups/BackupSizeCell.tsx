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

/**
 * Size value of a backup file. When the backup recorded its row counts, an
 * info icon precedes the size and the icon and size together are the hover
 * target of a tooltip listing how many words, questions and notes it holds.
 * Backups created before the counts were recorded render the size alone,
 * with no icon and no reserved space.
 */
export const BackupSizeCell: React.FC<{ backup: BackupFile }> = ({
  backup,
}) => {
  const size = formatFileSize(backup.size_bytes);
  const sizeText = (
    <span>
      {size.value} <span className='text-xs'>{size.unit}</span>
    </span>
  );

  if (!backup.summary) {
    return sizeText;
  }

  return (
    <Tooltip
      label='Backup contents'
      content={formatSummary(backup.summary)}
      className='gap-0.5'
    >
      <svg
        viewBox='0 0 20 20'
        className='h-[18px] w-[18px] shrink-0'
        fill='currentColor'
        aria-hidden='true'
      >
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z'
        />
      </svg>
      {sizeText}
    </Tooltip>
  );
};
