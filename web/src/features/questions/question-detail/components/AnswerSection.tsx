import React from 'react';

import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import { MarkdownContent } from '../../../../components/ui/MarkdownContent';
import { AnswerSectionProps } from '../types/question-detail';

const LIGHT_BULB_ICON_PATH =
  'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18';

export const AnswerSection: React.FC<AnswerSectionProps> = ({
  isExpanded,
  onToggle,
  answer,
  explanation,
  question,
}) => {
  // Get the content of the correct answer option
  const getCorrectAnswerContent = () => {
    switch (answer.toUpperCase()) {
      case 'A':
        return question.option_a;
      case 'B':
        return question.option_b;
      case 'C':
        return question.option_c;
      case 'D':
        return question.option_d;
      default:
        return null;
    }
  };

  const correctAnswerContent = getCorrectAnswerContent();
  return (
    <CollapsibleSection
      title='Answer & Explanation'
      isOpen={isExpanded}
      onToggle={onToggle}
      iconPath={LIGHT_BULB_ICON_PATH}
    >
      {/* Correct Answer Section */}
      <div>
        <h3 className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
          Correct Answer:
        </h3>
        <div className='flex items-start space-x-3'>
          {/* Answer Letter Badge */}
          <span className='inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 dark:bg-green-900 dark:text-green-300'>
            {answer.toUpperCase()}
          </span>
          {/* Answer Content */}
          <div className='flex-1'>
            <div className='text-base font-medium leading-relaxed text-gray-900 dark:text-white'>
              {correctAnswerContent || 'Answer content not found'}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Section */}
      {explanation && (
        <div className='mt-4 border-t border-gray-200 pt-4 dark:border-gray-700'>
          <h3 className='mb-2 border-b border-gray-200/40 pb-1 text-sm font-medium text-gray-900 dark:border-gray-700/40 dark:text-white'>
            Explanation
          </h3>
          <MarkdownContent content={explanation} variant='notes' />
        </div>
      )}
    </CollapsibleSection>
  );
};
