import React from 'react';

interface SuccessNotificationProps {
  message: string;
  onClose: () => void;
}

export const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  message,
  onClose
}) => {
  return (
    <div className="p-3 text-sm text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-md flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};