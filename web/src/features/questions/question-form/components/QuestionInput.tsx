import React from 'react';

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}) => {
  return (
    <div>
      <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Question <span className="text-red-500">*</span>
      </label>
      <textarea
        id="question"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 resize-none"
        placeholder="Enter the question..."
        disabled={disabled}
        autoFocus={autoFocus}
      />
    </div>
  );
};