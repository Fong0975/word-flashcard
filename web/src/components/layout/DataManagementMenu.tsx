import React, { useRef, useState } from 'react';

import { useToast } from '../../hooks/ui/useToast';
import { apiService } from '../../lib/api';
import { DataExportPayload, ImportSummary } from '../../types/data-export';
import { ToastContainer } from '../ui';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';

const downloadAsJsonFile = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const timestampForFilename = (): string =>
  new Date().toISOString().replace(/[:.]/g, '-');

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

const formatImportSummary = (summary: ImportSummary): string =>
  `Import completed — words: ${summary.words}, definitions: ${summary.word_definitions}, questions: ${summary.questions}, answer logs: ${summary.question_answer_logs}, practice logs: ${summary.word_practice_logs}, notes: ${summary.notes}.`;

/**
 * Settings dropdown in the header, offering a full-database JSON export
 * (download) and import (destructive restore, gated behind a confirmation
 * dialog since it replaces every existing row on the server).
 */
export const DataManagementMenu: React.FC = () => {
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<DataExportPayload | null>(
    null,
  );

  const handleExportClick = async (): Promise<void> => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      const data = await apiService.exportData();
      downloadAsJsonFile(
        data,
        `word-flashcard-export-${timestampForFilename()}.json`,
      );
      showSuccess('Export completed.');
    } catch (error) {
      showError(`Export failed: ${errorMessage(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    // Reset immediately so selecting the same file again still fires onChange
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const payload = JSON.parse(await file.text()) as DataExportPayload;
      setPendingImport(payload);
    } catch {
      showError(
        'Invalid file: could not parse it as a Flashcard export JSON file.',
      );
    }
  };

  const handleImportCancel = (): void => {
    setPendingImport(null);
  };

  const handleImportConfirm = async (): Promise<void> => {
    if (!pendingImport) {
      return;
    }

    setIsImporting(true);
    try {
      const summary = await apiService.importData(pendingImport);
      showSuccess(formatImportSummary(summary));
      setPendingImport(null);
    } catch (error) {
      showError(`Import failed: ${errorMessage(error)}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className='group relative'>
        <button
          type='button'
          className='rounded-md p-2 text-gray-500 transition-colors duration-200 focus:outline-none group-focus-within:bg-gray-100 group-focus-within:text-gray-900 group-hover:bg-gray-100 group-hover:text-gray-900 dark:text-gray-400 dark:group-focus-within:bg-gray-700 dark:group-focus-within:text-white dark:group-hover:bg-gray-700 dark:group-hover:text-white'
          aria-label='Settings'
          aria-haspopup='true'
        >
          <svg
            viewBox='0 0 24 24'
            className='h-5 w-5'
            fill='none'
            stroke='currentColor'
            strokeWidth={1.5}
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.216.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7.665 7.665 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
            />
          </svg>
        </button>

        <div className='absolute right-0 top-full z-10 hidden w-40 pt-2 group-focus-within:block group-hover:block'>
          <div
            className='rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-600'
            role='menu'
          >
            <div className='py-1'>
              <span className='block px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500'>
                Data
              </span>
              <button
                type='button'
                role='menuitem'
                onClick={handleImportClick}
                className='block w-full py-1.5 pl-8 pr-4 text-left text-xs text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white'
              >
                Import
              </button>
              <button
                type='button'
                role='menuitem'
                onClick={handleExportClick}
                disabled={isExporting}
                className='block w-full py-1.5 pl-8 pr-4 text-left text-xs text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white'
              >
                {isExporting ? 'Exporting…' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='application/json'
        aria-label='Import file'
        className='hidden'
        onChange={handleFileSelected}
      />

      <ConfirmationDialog
        isOpen={pendingImport !== null}
        title='Import Data'
        message='This will permanently replace ALL existing data on the server with the contents of the selected file. This action cannot be undone.'
        confirmText='Replace All Data'
        cancelText='Cancel'
        variant='danger'
        isConfirming={isImporting}
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
      />

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};
