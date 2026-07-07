import React, { useState } from 'react';

import { Modal } from '../../../components/ui/Modal';
import { DEFAULT_QUIZ_CONFIG, FamiliarityLevel } from '../constants';
import { useValidatedQuestionCount } from '../hooks/useValidatedQuestionCount';
import { useCategoryCounts } from '../hooks/useCategoryCounts';

import { CategoryCountInputs } from './CategoryCountInputs';
import { FamiliaritySelectionList } from './FamiliaritySelectionList';
import { QuizCountInput } from './QuizCountInput';

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

const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 100;

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
  const {
    questionCount,
    questionCountInput,
    questionCountError,
    handleQuestionCountChange,
    setQuestionCountInput,
    reset: resetQuestionCount,
  } = useValidatedQuestionCount(
    defaultQuestionCount,
    MIN_QUESTION_COUNT,
    MAX_QUESTION_COUNT,
  );

  const [selectedFamiliarity, setSelectedFamiliarity] = useState<
    FamiliarityLevel[]
  >(
    enableFamiliaritySelection
      ? [FamiliarityLevel.RED, FamiliarityLevel.YELLOW, FamiliarityLevel.GREEN]
      : [],
  );
  const [countMode, setCountMode] = useState<CountMode>('category');

  const {
    categoryCounts,
    categoryInputs,
    handleCategoryCountChange,
    categoryModeAllZero,
    reset: resetCategoryCounts,
  } = useCategoryCounts(MAX_QUESTION_COUNT);

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
    resetQuestionCount();
    if (enableFamiliaritySelection) {
      setSelectedFamiliarity([
        FamiliarityLevel.RED,
        FamiliarityLevel.YELLOW,
        FamiliarityLevel.GREEN,
      ]);
      setCountMode('category');
      resetCategoryCounts();
    }
    onClose();
  };

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
          <CategoryCountInputs
            categoryInputs={categoryInputs}
            categoryCounts={categoryCounts}
            onChange={handleCategoryCountChange}
            maxCount={MAX_QUESTION_COUNT}
            allZero={categoryModeAllZero}
          />
        )}

        {/* Familiarity Selection — total count mode only */}
        {enableFamiliaritySelection && countMode === 'total' && (
          <FamiliaritySelectionList
            selectedFamiliarity={selectedFamiliarity}
            onToggle={handleFamiliarityToggle}
          />
        )}

        {/* Question Count — hidden in category mode */}
        {(!enableFamiliaritySelection || countMode === 'total') && (
          <QuizCountInput
            value={questionCountInput}
            onChange={handleQuestionCountChange}
            error={questionCountError}
            count={questionCount}
            minCount={MIN_QUESTION_COUNT}
            maxCount={MAX_QUESTION_COUNT}
            quickOptions={DEFAULT_QUIZ_CONFIG.QUESTION_COUNT_OPTIONS}
            onQuickSelect={count => {
              setQuestionCountInput(count.toString());
              handleQuestionCountChange(count.toString());
            }}
          />
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
