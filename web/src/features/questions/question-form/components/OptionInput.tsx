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
        className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
      >
        Option {option} {isRequired && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        id={optionId}
        value={value}
        onChange={(e) => onChange(option, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
        placeholder={`Enter option ${option}${!isRequired ? ' (optional)' : ''}...`}
        disabled={disabled}
      />
    </div>
  );
};