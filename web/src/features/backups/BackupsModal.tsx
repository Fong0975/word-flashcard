import React, { useState } from 'react';

import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ToastContainer } from '../../components/ui';
import { apiService } from '../../lib/api';
import { API_CONFIG, API_ENDPOINTS } from '../../lib/api-config';
import { BackupFile } from '../../types/backups';
import { useAsyncOnOpen } from '../shared/hooks/useAsyncOnOpen';
import { useToast } from '../../hooks/ui/useToast';
import { formatDateTimeParts } from '../../utils/dateFormat';

interface BackupsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];

const JSON_EXTENSION = '.json';

/** Strips the trailing ".json" extension for display, e.g. in the Name column. */
const stripJsonExtension = (name: string): string =>
  name.endsWith(JSON_EXTENSION) ? name.slice(0, -JSON_EXTENSION.length) : name;

/** Extracts a human-readable message from a caught value. */
const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

/** Formats a byte count as a human-readable size (e.g. "482 KB"). */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${SIZE_UNITS[unitIndex]}`;
};

/**
 * Shows the scheduled backup files (word-flashcard-backup-*.json) currently
 * on the server's disk, as returned by GET /api/data/backups.
 */
export const BackupsModal: React.FC<BackupsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    data: backups,
    loading,
    error,
    refetch,
  } = useAsyncOnOpen<BackupFile[]>({
    isOpen,
    fetcher: () => apiService.getBackupFiles(),
    errorMessage: 'Failed to load backup files.',
  });

  const [isCreating, setIsCreating] = useState(false);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleCreateBackupClick = async (): Promise<void> => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      await apiService.triggerBackup();
      showSuccess('Backup created.');
      refetch();
    } catch (err) {
      showError(`Backup failed: ${errorMessage(err)}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Backups' maxWidth='lg'>
      <div className='mb-2 flex justify-end'>
        <button
          type='button'
          onClick={refetch}
          disabled={loading}
          aria-label='Refresh backup list'
          className='flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
        >
          <svg
            viewBox='0 0 24 24'
            className='h-3.5 w-3.5'
            fill='none'
            stroke='currentColor'
            strokeWidth={1.5}
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99'
            />
          </svg>
          Refresh
        </button>
      </div>

      {loading && <LoadingSpinner message='' />}

      {error && (
        <div className='flex h-24 items-center justify-center text-sm text-red-500'>
          {error}
        </div>
      )}

      {!loading && !error && backups && backups.length === 0 && (
        <p className='py-4 text-center text-sm text-gray-500 dark:text-gray-400'>
          No backup files yet.
        </p>
      )}

      {!loading && !error && backups && backups.length > 0 && (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400'>
                <th className='py-2 pl-2 pr-4 font-medium'>Name</th>
                <th className='py-2 pr-4 font-medium'>Size</th>
                <th className='py-2 pr-2 font-medium'>Modified</th>
              </tr>
            </thead>
            <tbody>
              {backups.map(backup => {
                const { date, time } = formatDateTimeParts(backup.modified_at);
                return (
                  <tr
                    key={backup.name}
                    className='border-b border-gray-100 last:border-0 dark:border-gray-700/50'
                  >
                    <td className='break-all py-2 pl-2 pr-4 text-gray-900 dark:text-white'>
                      <a
                        href={`${API_CONFIG.baseURL}${API_ENDPOINTS.downloadBackup(backup.name)}`}
                        download={backup.name}
                        className='text-blue-600 hover:underline dark:text-blue-400'
                      >
                        {stripJsonExtension(backup.name)}
                      </a>
                    </td>
                    <td className='whitespace-nowrap py-2 pr-4 text-gray-500 dark:text-gray-400'>
                      {formatFileSize(backup.size_bytes)}
                    </td>
                    <td className='whitespace-nowrap py-2 pr-2 text-gray-500 dark:text-gray-400'>
                      <div className='flex flex-col'>
                        <span>{date}</span>
                        <span className='text-xs text-gray-400 dark:text-gray-500'>
                          {time}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className='mt-4 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-700'>
        <button
          type='button'
          onClick={handleCreateBackupClick}
          disabled={isCreating}
          className='flex items-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isCreating && (
            <svg
              className='h-4 w-4 animate-spin text-white'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          )}
          {isCreating ? 'Backing Up…' : 'Backup Now'}
        </button>
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </Modal>
  );
};
