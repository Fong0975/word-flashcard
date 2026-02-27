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
      <label
        htmlFor='question'
        className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
      >
        Question <span className='text-red-500'>*</span>
      </label>
      <textarea
        id='question'
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className='w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800'
        placeholder='Enter the question...'
        disabled={disabled}
        autoFocus={autoFocus}
      />
    </div>
  );
};
