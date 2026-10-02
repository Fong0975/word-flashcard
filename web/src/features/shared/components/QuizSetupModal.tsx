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
            <div className='glass-panel flex overflow-hidden rounded-md text-sm'>
              <button
                type='button'
                onClick={() => setCountMode('total')}
                className={`rounded-l-md px-4 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  countMode === 'total'
                    ? 'glass-button-primary'
                    : 'glass-interactive text-gray-600 dark:text-gray-300'
                }`}
              >
                Total Count
              </button>
              <button
                type='button'
                onClick={() => setCountMode('category')}
                className={`segmented-divider rounded-r-md px-4 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  countMode === 'category'
                    ? 'glass-button-primary'
                    : 'glass-interactive text-gray-600 dark:text-gray-300'
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
            className='glass-interactive flex-1 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300'
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
                : 'glass-button-primary'
            } `}
          >
            Start Quiz
          </button>
        </div>
      </div>
    </Modal>
  );
};
