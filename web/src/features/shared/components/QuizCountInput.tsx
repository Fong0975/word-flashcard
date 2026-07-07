import React from 'react';

interface QuizCountInputProps {
  value: string;
  onChange: (value: string) => void;
  error: string;
  count: number;
  minCount: number;
  maxCount: number;
  quickOptions: readonly number[];
  onQuickSelect: (count: number) => void;
}

export const QuizCountInput: React.FC<QuizCountInputProps> = ({
  value,
  onChange,
  error,
  count,
  minCount,
  maxCount,
  quickOptions,
  onQuickSelect,
}) => (
  <div>
    <label className='mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300'>
      Number of Questions
    </label>
    <div className='space-y-2'>
      <input
        type='number'
        value={value}
        onChange={e => onChange(e.target.value)}
        min={minCount}
        max={maxCount}
        placeholder={`Enter number (${minCount}-${maxCount})`}
        className={`w-full rounded-md border bg-white px-3 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
          error
            ? 'border-red-500 dark:border-red-400'
            : 'border-gray-300 dark:border-gray-600'
        } `}
      />
      {error && <p className='text-sm text-red-500'>{error}</p>}
      {!error && count > 0 && (
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          Quiz will contain {count} question
          {count !== 1 ? 's' : ''}.
        </p>
      )}

      {/* Quick selection buttons */}
      <div>
        <p className='mb-2 text-xs text-gray-500 dark:text-gray-400'>
          Quick select:
        </p>
        <div className='flex flex-wrap gap-2'>
          {quickOptions.map(option => (
            <button
              key={option}
              type='button'
              onClick={() => onQuickSelect(option)}
              className='rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);
