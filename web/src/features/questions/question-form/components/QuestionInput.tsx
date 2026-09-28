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
        className='glass-input w-full resize-none px-3 py-2'
        placeholder='Enter the question...'
        disabled={disabled}
        autoFocus={autoFocus}
      />
    </div>
  );
};
