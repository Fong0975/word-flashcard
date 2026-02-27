import React from 'react';

import { AnswerOption, QuestionFormData } from '../types/question-form';

import { OptionInput } from './OptionInput';

interface OptionsGroupProps {
  options: QuestionFormData['options'];
  onChange: (option: AnswerOption, value: string) => void;
  disabled?: boolean;
}

export const OptionsGroup: React.FC<OptionsGroupProps> = ({
  options,
  onChange,
  disabled = false,
}) => {
  return (
    <div>
      <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
        Options
      </label>
      <div className='space-y-3'>
        <OptionInput
          option='A'
          value={options.A}
          onChange={onChange}
          disabled={disabled}
          required
        />
        <OptionInput
          option='B'
          value={options.B}
          onChange={onChange}
          disabled={disabled}
        />
        <OptionInput
          option='C'
          value={options.C}
          onChange={onChange}
          disabled={disabled}
        />
        <OptionInput
          option='D'
          value={options.D}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
