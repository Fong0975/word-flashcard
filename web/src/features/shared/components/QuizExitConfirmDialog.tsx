import React from 'react';
import { createPortal } from 'react-dom';

const EXIT_CONFIRM_TITLE = 'Exit Quiz';
const EXIT_CONFIRM_MESSAGE =
  "Are you sure you want to exit the quiz? Your progress will be lost and you'll need to start over.";

interface QuizExitConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const QuizExitConfirmDialog: React.FC<QuizExitConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) {
    return null;
  }

  // Portaled to document.body so this fixed-position overlay always covers
  // the full viewport, regardless of whether an ancestor (e.g. the glass
  // Header, which applies backdrop-blur) establishes its own containing
  // block for fixed-position descendants.
  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
      <div className='glass-panel-strong mx-4 w-full max-w-sm rounded-lg p-6 shadow-xl'>
        <div className='mb-4 flex items-center'>
          <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
            <svg
              className='h-6 w-6 text-red-600 dark:text-red-400'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
              />
            </svg>
          </div>
          <div className='ml-4'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
              {EXIT_CONFIRM_TITLE}
            </h3>
          </div>
        </div>
        <div className='mb-6'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            {EXIT_CONFIRM_MESSAGE}
          </p>
        </div>
        <div className='flex justify-end space-x-3'>
          <button
            type='button'
            onClick={onCancel}
            className='glass-interactive rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            Continue Quiz
          </button>
          <button
            type='button'
            onClick={onConfirm}
            className='rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
          >
            Exit Quiz
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
