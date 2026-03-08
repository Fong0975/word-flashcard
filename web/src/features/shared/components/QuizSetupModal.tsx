import React, { useState } from 'react';

import { Modal } from '../../../components/ui/Modal';
import {
  FAMILIARITY_OPTIONS,
  DEFAULT_QUIZ_CONFIG,
  FamiliarityLevel,
} from '../constants';

export interface QuizSetupConfig {
  questionCount: number;
  selectedFamiliarity?: FamiliarityLevel[];
}

interface QuizSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (config: QuizSetupConfig) => void;
  title: string;
  entityName: string; // e.g., "words", "questions"
  enableFamiliaritySelection?: boolean;
  defaultQuestionCount?: number;
}

/**
 * Generic Quiz Setup Modal component
 *
 * Supports both quiz types:
 * - Words Quiz: with familiarity selection (red, yellow, green)
 * - Questions Quiz: without familiarity selection
 *
 * @example
 * ```tsx
 * // For Words Quiz
 * <QuizSetupModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   onStartQuiz={handleStartQuiz}
 *   title="Word Quiz Setup"
 *   entityName="words"
 *   enableFamiliaritySelection={true}
 * />
 *
 * // For Questions Quiz
 * <QuizSetupModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   onStartQuiz={handleStartQuiz}
 *   title="Question Quiz Setup"
 *   entityName="questions"
 *   enableFamiliaritySelection={false}
 * />
 * ```
 */
export const QuizSetupModal: React.FC<QuizSetupModalProps> = ({
  isOpen,
  onClose,
  onStartQuiz,
  title,
  entityName,
  enableFamiliaritySelection = false,
  defaultQuestionCount = DEFAULT_QUIZ_CONFIG.QUESTION_COUNT,
}) => {
  const [questionCount, setQuestionCount] =
    useState<number>(defaultQuestionCount);
  const [questionCountInput, setQuestionCountInput] = useState<string>(
    defaultQuestionCount.toString(),
  );
  const [questionCountError, setQuestionCountError] = useState<string>('');
  const [selectedFamiliarity, setSelectedFamiliarity] = useState<
    FamiliarityLevel[]
  >(
    enableFamiliaritySelection
      ? [FamiliarityLevel.RED, FamiliarityLevel.YELLOW, FamiliarityLevel.GREEN]
      : [],
  );

  // 驗證題目數量的常數
  const MIN_QUESTION_COUNT = 1;
  const MAX_QUESTION_COUNT = 100;

  // 處理輸入框變化和驗證
  const handleQuestionCountChange = (value: string) => {
    setQuestionCountInput(value);

    // 清除之前的錯誤
    setQuestionCountError('');

    // 如果輸入為空，設置錯誤
    if (!value.trim()) {
      setQuestionCountError('Please enter a number of questions.');
      setQuestionCount(0);
      return;
    }

    const numValue = parseInt(value, 10);

    // 檢查是否為有效數字
    if (isNaN(numValue)) {
      setQuestionCountError('Please enter a valid number.');
      setQuestionCount(0);
      return;
    }

    // 檢查範圍
    if (numValue < MIN_QUESTION_COUNT) {
      setQuestionCountError(
        `Number of questions must be at least ${MIN_QUESTION_COUNT}.`,
      );
      setQuestionCount(numValue);
      return;
    }

    if (numValue > MAX_QUESTION_COUNT) {
      setQuestionCountError(
        `Number of questions cannot exceed ${MAX_QUESTION_COUNT}.`,
      );
      setQuestionCount(numValue);
      return;
    }

    // 有效的輸入
    setQuestionCount(numValue);
  };

  const handleFamiliarityToggle = (value: FamiliarityLevel) => {
    setSelectedFamiliarity(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleStartQuiz = () => {
    const isValidConfig =
      questionCount >= MIN_QUESTION_COUNT &&
      questionCount <= MAX_QUESTION_COUNT &&
      questionCountError === '' &&
      (!enableFamiliaritySelection || selectedFamiliarity.length > 0);

    if (isValidConfig) {
      const config: QuizSetupConfig = {
        questionCount,
        ...(enableFamiliaritySelection && { selectedFamiliarity }),
      };
      onStartQuiz(config);
      handleClose();
    }
  };

  const handleClose = () => {
    setQuestionCount(defaultQuestionCount);
    setQuestionCountInput(defaultQuestionCount.toString());
    setQuestionCountError('');
    if (enableFamiliaritySelection) {
      setSelectedFamiliarity([
        FamiliarityLevel.RED,
        FamiliarityLevel.YELLOW,
        FamiliarityLevel.GREEN,
      ]);
    }
    onClose();
  };

  const isStartDisabled =
    questionCount < MIN_QUESTION_COUNT ||
    questionCount > MAX_QUESTION_COUNT ||
    questionCountError !== '' ||
    (enableFamiliaritySelection && selectedFamiliarity.length === 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth='md'
      disableBackdropClose={true}
      disableEscapeClose={true}
    >
      <div className='space-y-6'>
        {/* Description */}
        <div className='text-sm text-gray-600 dark:text-gray-300'>
          Configure your {entityName} quiz settings below.
        </div>

        {/* Familiarity Selection (only for Words Quiz) */}
        {enableFamiliaritySelection && (
          <div>
            <label className='mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Select Familiarity Levels
            </label>
            <div className='space-y-2'>
              {FAMILIARITY_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                    selectedFamiliarity.includes(option.value)
                      ? option.bgColor + ' border-current'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  } `}
                >
                  <input
                    type='checkbox'
                    checked={selectedFamiliarity.includes(option.value)}
                    onChange={() => handleFamiliarityToggle(option.value)}
                    className='sr-only'
                  />
                  <div
                    className={`mr-3 h-4 w-4 rounded-full ${option.value === FamiliarityLevel.GREEN ? 'bg-green-500' : option.value === FamiliarityLevel.YELLOW ? 'bg-yellow-500' : 'bg-red-500'}`}
                  />
                  <span
                    className={`font-medium ${selectedFamiliarity.includes(option.value) ? option.color : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {option.label} Level
                  </span>
                  {selectedFamiliarity.includes(option.value) && (
                    <svg
                      className='ml-auto h-4 w-4 text-current dark:text-gray-300'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  )}
                </label>
              ))}
            </div>
            {selectedFamiliarity.length === 0 && (
              <p className='mt-2 text-sm text-red-500'>
                Please select at least one familiarity level.
              </p>
            )}
          </div>
        )}

        {/* Question Count */}
        <div>
          <label className='mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Number of Questions
          </label>
          <div className='space-y-2'>
            <input
              type='number'
              value={questionCountInput}
              onChange={e => handleQuestionCountChange(e.target.value)}
              min={MIN_QUESTION_COUNT}
              max={MAX_QUESTION_COUNT}
              placeholder={`Enter number (${MIN_QUESTION_COUNT}-${MAX_QUESTION_COUNT})`}
              className={`w-full rounded-md border bg-white px-3 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
                questionCountError
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } `}
            />
            {questionCountError && (
              <p className='text-sm text-red-500'>{questionCountError}</p>
            )}
            {!questionCountError && questionCount > 0 && (
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Quiz will contain {questionCount} question
                {questionCount !== 1 ? 's' : ''}.
              </p>
            )}

            {/* Quick selection buttons */}
            <div>
              <p className='mb-2 text-xs text-gray-500 dark:text-gray-400'>
                Quick select:
              </p>
              <div className='flex flex-wrap gap-2'>
                {DEFAULT_QUIZ_CONFIG.QUESTION_COUNT_OPTIONS.map(count => (
                  <button
                    key={count}
                    type='button'
                    onClick={() => {
                      setQuestionCountInput(count.toString());
                      handleQuestionCountChange(count.toString());
                    }}
                    className='rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex space-x-3 pt-4'>
          <button
            type='button'
            onClick={handleClose}
            className='flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleStartQuiz}
            disabled={isStartDisabled}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isStartDisabled
                ? 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            } `}
          >
            Start Quiz
          </button>
        </div>
      </div>
    </Modal>
  );
};
