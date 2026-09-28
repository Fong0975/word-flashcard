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
      <div className='pl-3'>
        <input
          type='text'
          id='word'
          value={value}
          onChange={handleChange}
          className='glass-input w-full px-3 py-2'
          placeholder='Enter a word (e.g., garage)'
          disabled={disabled}
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
};
