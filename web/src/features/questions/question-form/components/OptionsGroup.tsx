import React from 'react';

import { AnswerOption, QuestionFormData } from '../types/question-form';

import { OptionInput } from './OptionInput';

interface OptionsGroupProps {
  options: QuestionFormData['options'];
  onChange: (option: AnswerOption, value: string) => void;
  /** The option currently marked as the correct answer, or '' if none. */
  answer: string;
  onAnswerChange: (option: AnswerOption) => void;
  disabled?: boolean;
}

const ANSWER_OPTIONS: readonly AnswerOption[] = ['A', 'B', 'C', 'D'];

export const OptionsGroup: React.FC<OptionsGroupProps> = ({
  options,
  onChange,
  answer,
  onAnswerChange,
  disabled = false,
}) => {
  return (
    <div>
      <label
        id='options-label'
        className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
      >
        Options <span className='text-error'>*</span>
      </label>
      <div
        role='radiogroup'
        aria-labelledby='options-label'
        aria-required='true'
        className='space-y-3'
      >
        {ANSWER_OPTIONS.map(option => (
          <OptionInput
            key={option}
            option={option}
            value={options[option]}
            onChange={onChange}
            isCorrect={answer === option}
            onSelectCorrect={onAnswerChange}
            disabled={disabled}
          />
        ))}
      </div>
      <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
        Use the switch next to an option to mark it as the correct answer
      </p>
    </div>
  );
};
