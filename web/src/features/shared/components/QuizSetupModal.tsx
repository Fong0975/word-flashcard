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
  perCategoryCounts?: {
    red: number;
    yellow: number;
    green: number;
  };
}

interface QuizSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (config: QuizSetupConfig) => void;
  title: string;
  entityName: string;
  enableFamiliaritySelection?: boolean;
  defaultQuestionCount?: number;
}

type CountMode = 'total' | 'category';

const CATEGORY_ORDER = [
  FamiliarityLevel.RED,
  FamiliarityLevel.YELLOW,
  FamiliarityLevel.GREEN,
] as const;

const FAMILIARITY_LABELS: Record<FamiliarityLevel, string> = {
  [FamiliarityLevel.RED]: 'Unfamiliar',
  [FamiliarityLevel.YELLOW]: 'Somewhat Familiar',
  [FamiliarityLevel.GREEN]: 'Familiar',
};

const FAMILIARITY_DOT_COLORS: Record<FamiliarityLevel, string> = {
  [FamiliarityLevel.RED]: 'bg-red-500',
  [FamiliarityLevel.YELLOW]: 'bg-yellow-500',
  [FamiliarityLevel.GREEN]: 'bg-green-500',
};

const defaultCategoryCounts = (): Record<FamiliarityLevel, number> => ({
  [FamiliarityLevel.RED]: 7,
  [FamiliarityLevel.YELLOW]: 5,
  [FamiliarityLevel.GREEN]: 3,
});

const defaultCategoryInputs = (): Record<FamiliarityLevel, string> => ({
  [FamiliarityLevel.RED]: '7',
  [FamiliarityLevel.YELLOW]: '5',
  [FamiliarityLevel.GREEN]: '3',
});

/**
 * Generic Quiz Setup Modal component
 *
 * Supports both quiz types:
 * - Words Quiz: with familiarity selection (red, yellow, green)
 * - Questions Quiz: without familiarity selection
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
  const [countMode, setCountMode] = useState<CountMode>('category');
  const [categoryCounts, setCategoryCounts] = useState<
    Record<FamiliarityLevel, number>
  >(defaultCategoryCounts());
  const [categoryInputs, setCategoryInputs] = useState<
    Record<FamiliarityLevel, string>
  >(defaultCategoryInputs());

  const MIN_QUESTION_COUNT = 1;
  const MAX_QUESTION_COUNT = 100;

  const handleQuestionCountChange = (value: string) => {
    setQuestionCountInput(value);
    setQuestionCountError('');

    if (!value.trim()) {
      setQuestionCountError('Please enter a number of questions.');
      setQuestionCount(0);
      return;
    }

    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) {
      setQuestionCountError('Please enter a valid number.');
      setQuestionCount(0);
      return;
    }

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

    setQuestionCount(numValue);
  };

  const handleCategoryCountChange = (
    level: FamiliarityLevel,
    value: string,
  ) => {
    setCategoryInputs(prev => ({ ...prev, [level]: value }));
    const num = parseInt(value, 10);
    const clamped =
      isNaN(num) || num < 0 ? 0 : Math.min(num, MAX_QUESTION_COUNT);
    setCategoryCounts(prev => ({ ...prev, [level]: clamped }));
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
    if (enableFamiliaritySelection && countMode === 'category') {
      const hasAny = Object.values(categoryCounts).some(v => v > 0);
      if (!hasAny) {
        return;
      }
      onStartQuiz({
        questionCount: 0,
        perCategoryCounts: {
          red: categoryCounts[FamiliarityLevel.RED],
          yellow: categoryCounts[FamiliarityLevel.YELLOW],
          green: categoryCounts[FamiliarityLevel.GREEN],
        },
      });
      handleClose();
      return;
    }

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
      setCountMode('category');
      setCategoryCounts(defaultCategoryCounts());
      setCategoryInputs(defaultCategoryInputs());
    }
    onClose();
  };

  const categoryModeAllZero = Object.values(categoryCounts).every(v => v === 0);

  const isStartDisabled =
    enableFamiliaritySelection && countMode === 'category'
      ? categoryModeAllZero
      : questionCount < MIN_QUESTION_COUNT ||
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

        {/* Count Mode Toggle (Words Quiz only) */}
        {enableFamiliaritySelection && (
          <div className='flex justify-center'>
            <div className='flex rounded-md border border-gray-300 text-sm dark:border-gray-600'>
              <button
                type='button'
                onClick={() => setCountMode('total')}
                className={`rounded-l-md px-4 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  countMode === 'total'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Total Count
              </button>
              <button
                type='button'
                onClick={() => setCountMode('category')}
                className={`rounded-r-md border-l border-gray-300 px-4 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-gray-600 ${
                  countMode === 'category'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                By Category
              </button>
            </div>
          </div>
        )}

        {/* By Category: per-familiarity count inputs */}
        {enableFamiliaritySelection && countMode === 'category' && (
          <div>
            <label className='mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Words per Category
            </label>
            <div className='space-y-3'>
              {CATEGORY_ORDER.map(level => (
                <div key={level} className='flex items-center gap-3'>
                  <div
                    className={`h-4 w-4 flex-shrink-0 rounded-full ${FAMILIARITY_DOT_COLORS[level]}`}
                  />
                  <span className='flex-1 text-sm text-gray-700 dark:text-gray-300'>
                    {FAMILIARITY_LABELS[level]}
                  </span>
                  <input
                    type='number'
                    min={0}
                    max={MAX_QUESTION_COUNT}
                    value={categoryInputs[level]}
                    onChange={e =>
                      handleCategoryCountChange(level, e.target.value)
                    }
                    className='w-20 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                  />
                </div>
              ))}
            </div>
            <div className='mt-3 flex items-center gap-3 border-t border-gray-200 pt-3 dark:border-gray-600'>
              <div className='h-4 w-4 flex-shrink-0' />
              <span className='flex-1 text-sm font-medium text-gray-700 dark:text-gray-300'>
                Total
              </span>
              <div className='w-20 text-center text-sm font-semibold text-gray-900 dark:text-white'>
                {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
              Set a category to 0 to skip it.
            </p>
            {categoryModeAllZero && (
              <p className='mt-2 text-sm text-red-500'>
                Please set at least one category count greater than 0.
              </p>
            )}
          </div>
        )}

        {/* Familiarity Selection — total count mode only */}
        {enableFamiliaritySelection && countMode === 'total' && (
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

        {/* Question Count — hidden in category mode */}
        {(!enableFamiliaritySelection || countMode === 'total') && (
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
        )}

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
