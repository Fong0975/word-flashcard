import React from 'react';

import { AnswerOption } from '../types/question-form';

interface OptionInputProps {
  option: AnswerOption;
  value: string;
  onChange: (option: AnswerOption, value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export const OptionInput: React.FC<OptionInputProps> = ({
  option,
  value,
  onChange,
  disabled = false,
  required = false,
}) => {
  const optionId = `option${option}`;
  const isRequired = option === 'A' || required;

  return (
    <div>
      <label
        htmlFor={optionId}
        className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'
      >
        Option {option} {isRequired && <span className='text-red-500'>*</span>}
      </label>
      <input
        type='text'
        id={optionId}
        value={value}
        onChange={e => onChange(option, e.target.value)}
        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800'
        placeholder={`Enter option ${option}${!isRequired ? ' (optional)' : ''}...`}
        disabled={disabled}
      />
    </div>
  );
};
