import React from 'react';

interface WordInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  disabled: boolean;
  autoFocus?: boolean;
}

export const WordInput: React.FC<WordInputProps> = ({
  value,
  onChange,
  onSearchChange,
  disabled,
  autoFocus = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    onSearchChange(newValue);
  };

  return (
    <div>
      <label
        htmlFor='word'
        className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
      >
        Word
      </label>
      <input
        type='text'
        id='word'
        value={value}
        onChange={handleChange}
        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800'
        placeholder='Enter a word (e.g., garage)'
        disabled={disabled}
        autoFocus={autoFocus}
      />
    </div>
  );
};
