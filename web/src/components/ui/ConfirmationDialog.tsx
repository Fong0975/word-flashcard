/**
 * Generic confirmation dialog component for user confirmations
 *
 * This component provides a standardized way to ask for user confirmation
 * with customizable titles, messages, and button styles.
 */

import React from 'react';

export interface ConfirmationDialogProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmText: string;
  readonly cancelText?: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly variant?: 'danger' | 'warning' | 'info';
  readonly isConfirming?: boolean;
}

/**
 * Confirmation dialog component
 *
 * @example
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 * const [isDeleting, setIsDeleting] = useState(false);
 *
 * <ConfirmationDialog
 *   isOpen={showConfirm}
 *   title="Delete Word"
 *   message={`Are you sure you want to delete "${word.word}"? This action cannot be undone.`}
 *   confirmText="Delete Word"
 *   cancelText="Cancel"
 *   variant="danger"
 *   isConfirming={isDeleting}
 *   onConfirm={handleDeleteConfirm}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  isConfirming = false,
}) => {
  if (!isOpen) {
    return null;
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: (
            <svg
              className='h-6 w-6 text-red-600 dark:text-red-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
              />
            </svg>
          ),
          iconBg: 'bg-red-100 dark:bg-red-900',
          confirmButton:
            'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
        };
      case 'warning':
        return {
          icon: (
            <svg
              className='h-6 w-6 text-yellow-600 dark:text-yellow-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
              />
            </svg>
          ),
          iconBg: 'bg-yellow-100 dark:bg-yellow-900',
          confirmButton:
            'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        };
      case 'info':
        return {
          icon: (
            <svg
              className='h-6 w-6 text-blue-600 dark:text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          ),
          iconBg: 'bg-blue-100 dark:bg-blue-900',
          confirmButton:
            'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        };
      default:
        return {
          icon: null,
          iconBg: 'bg-gray-100 dark:bg-gray-900',
          confirmButton:
            'text-white bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800'>
        <div className='mb-4 flex items-center'>
          <div
            className={`h-10 w-10 flex-shrink-0 rounded-full ${styles.iconBg} flex items-center justify-center`}
          >
            {styles.icon}
          </div>
          <div className='ml-4'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
              {title}
            </h3>
          </div>
        </div>

        <div className='mb-6'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>{message}</p>
        </div>

        <div className='flex justify-end space-x-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isConfirming}
            className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          >
            {cancelText}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isConfirming}
            className={`flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${styles.confirmButton}`}
          >
            {isConfirming && (
              <svg
                className='-ml-1 mr-2 h-4 w-4 animate-spin text-white'
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
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
