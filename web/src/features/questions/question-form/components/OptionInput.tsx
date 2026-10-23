import React from 'react';

import { OptionInputProps } from '../types/question-form';

export const OptionInput: React.FC<OptionInputProps> = ({
  option,
  value,
  onChange,
  isCorrect,
  onSelectCorrect,
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
      <div className='flex items-center gap-2'>
        {/* An empty option can't be the correct answer, so its switch stays
            disabled until the option has text. */}
        <input
          type='radio'
          name='correctAnswer'
          value={option}
          checked={isCorrect}
          onChange={() => onSelectCorrect(option)}
          className='glass-switch'
          aria-label={`Mark option ${option} as the correct answer`}
          disabled={disabled || !value.trim()}
        />
        <input
          type='text'
          id={optionId}
          value={value}
          onChange={e => onChange(option, e.target.value)}
          className='glass-input min-w-0 flex-1 px-3 py-2'
          placeholder={`Enter option ${option}${!isRequired ? ' (optional)' : ''}...`}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
