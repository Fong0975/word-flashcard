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
        Option {option} {isRequired && <span className='text-error'>*</span>}
      </label>
      <input
        type='text'
        id={optionId}
        value={value}
        onChange={e => onChange(option, e.target.value)}
        className='glass-input w-full px-3 py-2'
        placeholder={`Enter option ${option}${!isRequired ? ' (optional)' : ''}...`}
        disabled={disabled}
      />
    </div>
  );
};
