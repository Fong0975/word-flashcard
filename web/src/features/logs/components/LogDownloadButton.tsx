import React, { useState } from 'react';

import { ToastContainer } from '../../../components/ui';
import { useToast } from '../../../hooks/ui/useToast';
import { apiService } from '../../../lib/api';
import { downloadBlob, timestampForFilename } from '../../../lib/fileDownload';
import { HEADER_ICON_BUTTON_CLASS } from '../constants';

const DOWNLOAD_FILENAME_PREFIX = 'word-flashcard-logs';

/**
 * Picks the saved file's extension from the response type.
 *
 * The name is decided here rather than read from the backend's
 * Content-Disposition because the API is cross-origin and that header is not
 * exposed to scripts, while Content-Type always is.
 */
const extensionFor = (blob: Blob): string =>
  blob.type.includes('zip') ? 'zip' : 'log';

/**
 * Icon button that downloads every backend log file.
 *
 * The backend sends the plain `.log` file when only one exists and a zip
 * archive once there are rotated siblings. The button is disabled while a
 * download is in flight, and the outcome is reported through a toast.
 */
export const LogDownloadButton: React.FC = () => {
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (): Promise<void> => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await apiService.downloadLogs();
      downloadBlob(
        blob,
        `${DOWNLOAD_FILENAME_PREFIX}-${timestampForFilename()}.${extensionFor(blob)}`,
      );
      showSuccess('Log download completed.');
    } catch (error) {
      showError(
        `Log download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button
        type='button'
        onClick={handleDownload}
        disabled={isDownloading}
        aria-busy={isDownloading}
        aria-label='Download logs'
        title='Download log files'
        className={HEADER_ICON_BUTTON_CLASS}
      >
        <svg
          className='h-4 w-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={2}
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 3v11.5M7.5 10l4.5 4.5 4.5-4.5'
          />
        </svg>
      </button>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};
