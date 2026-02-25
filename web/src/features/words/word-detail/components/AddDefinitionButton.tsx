import React from 'react';

interface AddDefinitionButtonProps {
  onClick: () => void;
}

export const AddDefinitionButton: React.FC<AddDefinitionButtonProps> = ({ onClick }) => {
  return (
    <div className="flex justify-end mb-4">
      <button
        type="button"
        onClick={onClick}
        className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
        title="Add new definition"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
};