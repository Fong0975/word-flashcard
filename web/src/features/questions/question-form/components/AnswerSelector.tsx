import React from 'react';

interface AnswerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const AnswerSelector: React.FC<AnswerSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div>
      <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Correct Answer <span className="text-red-500">*</span>
      </label>
      <select
        id="answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
        disabled={disabled}
      >
        <option value="">Select the correct answer...</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D</option>
      </select>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Select the correct answer option (A, B, C, or D)
      </p>
    </div>
  );
};