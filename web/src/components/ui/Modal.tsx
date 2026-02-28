import React, { useEffect } from 'react';

import { useModalScrollManager } from '../../hooks/ui/useModalScrollManager';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  disableBackdropClose?: boolean;
  disableEscapeClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  className = '',
  disableBackdropClose = false,
  disableEscapeClose = false,
}) => {
  // Use modal scroll manager for consistent scrollbar behavior
  useModalScrollManager(isOpen);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !disableEscapeClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, disableEscapeClose]);

  if (!isOpen) {
    return null;
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className='fixed inset-0 z-50 !mt-0 overflow-y-auto'>
      {/* Background overlay */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
        onClick={disableBackdropClose ? undefined : onClose}
        aria-hidden='true'
      />

      {/* Modal container */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div
          className={`relative w-full ${maxWidthClasses[maxWidth]} transform rounded-lg bg-white shadow-xl transition-all duration-200 ease-in-out dark:bg-gray-800 ${className} `}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                {title}
              </h3>
              <button
                onClick={onClose}
                className='text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200'
                aria-label='Close modal'
              >
                <svg
                  className='h-6 w-6'
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
          )}

          {/* Content */}
          <div className='px-2 py-4 md:px-3 lg:px-4'>{children}</div>

          {/* Close button when no title */}
          {!title && (
            <button
              onClick={onClose}
              className='absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200'
              aria-label='Close modal'
            >
              <svg
                className='h-6 w-6'
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
          )}
        </div>
      </div>
    </div>
  );
};
