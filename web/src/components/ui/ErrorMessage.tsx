import React from 'react';

interface ErrorMessageProps {
  error: string;
  onRetry: () => void;
  onDismiss: () => void;
  title?: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  title = 'Error loading data',
  className = ''
}) => (
  <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6 ${className}`}>
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg
          className="h-5 w-5 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
          {title}
        </h3>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
        <div className="mt-3 flex space-x-3">
          <button
            onClick={onRetry}
            className="bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-800 dark:text-red-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <button
            onClick={onDismiss}
            className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </div>
);