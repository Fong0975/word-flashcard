import React, { useState } from 'react';

import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { getApiErrorMessage } from '../../../lib/apiErrorMessage';

interface ReminderBannerProps {
  reminder: string;
  /** What the reminder belongs to, e.g. "word"; used in the confirmation. */
  entityName: string;
  /** Persists the cleared reminder; a rejection is reported through onError. */
  onClear: () => Promise<void>;
  onError: (message: string) => void;
  className?: string;
}

/**
 * Shows a saved reminder note, with a button that clears it after
 * confirmation.
 */
export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  reminder,
  entityName,
  onClear,
  onError,
  className = '',
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    try {
      setIsClearing(true);
      await onClear();
      setShowClearConfirm(false);
    } catch (error) {
      onError('Failed to clear reminder: ' + getApiErrorMessage(error));
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <div
        className={`flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/50 dark:bg-amber-900/20 ${className}`}
      >
        <svg
          className='mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path
            fillRule='evenodd'
            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
            clipRule='evenodd'
          />
        </svg>
        <p className='min-w-0 flex-1 text-sm text-amber-800 dark:text-amber-300'>
          {reminder}
        </p>
        <button
          type='button'
          onClick={() => setShowClearConfirm(true)}
          className='focus-ring-warning mt-0.5 shrink-0 rounded-md text-amber-700 transition-colors hover:text-amber-900 dark:text-amber-500 dark:hover:text-amber-300'
          aria-label='Clear reminder'
        >
          <svg
            className='h-4 w-4'
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
      </div>

      <ConfirmationDialog
        isOpen={showClearConfirm}
        title='Clear Reminder'
        message={`Are you sure you want to clear the reminder for this ${entityName}?`}
        confirmText='Clear'
        cancelText='Cancel'
        onConfirm={handleClear}
        onCancel={() => setShowClearConfirm(false)}
        variant='warning'
        isConfirming={isClearing}
      />
    </>
  );
};
