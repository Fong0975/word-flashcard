import React from 'react';

import { WordQuizResult } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';
import { QuizLoadingScreen } from '../../shared/components/QuizLoadingScreen';
import { QuizErrorScreen } from '../../shared/components/QuizErrorScreen';
import { apiService } from '../../../lib/api';
import {
  extractPronunciationUrls,
  isValidAudioUrl,
} from '../../shared/phonetics';

import { WordQuizNavHeader } from './components/WordQuizNavHeader';
import { WordQuestionDisplay } from './components/WordQuestionDisplay';
import { PronunciationControls } from './components/PronunciationControls';
import { WordDefinitionsPanel } from './components/WordDefinitionsPanel';
import { ReminderNoteInput } from './components/ReminderNoteInput';
import { FamiliarityRatingButtons } from './components/FamiliarityRatingButtons';
import { useWordQuizData } from './hooks/useWordQuizData';
import { useReminderNote } from './hooks/useReminderNote';
import { useWordQuizStep } from './hooks/useWordQuizStep';

interface WordQuizProps {
  selectedFamiliarity: readonly FamiliarityLevel[];
  questionCount: number;
  perCategoryCounts?: { red: number; yellow: number; green: number };
  onQuizComplete: (results: WordQuizResult[]) => void;
  onBackToHome: () => void;
  onError?: (message: string) => void;
}

export const WordQuiz: React.FC<WordQuizProps> = ({
  selectedFamiliarity,
  questionCount,
  perCategoryCounts,
  onQuizComplete,
  onBackToHome,
  onError,
}) => {
  const { state, setState, words, error, setError } = useWordQuizData({
    selectedFamiliarity,
    questionCount,
    perCategoryCounts,
    onError,
  });
  const {
    currentWordIndex,
    currentWord,
    showAnswer,
    isFirstStep,
    isLastStep,
    progress,
    decisions,
    recordDecision,
    advance,
    goBack,
    buildAllResults,
  } = useWordQuizStep(words);
  const {
    reminderEnabled,
    reminderText,
    setReminderEnabled,
    setReminderText,
    resetReminder,
    getPendingReminder,
  } = useReminderNote();

  const completeQuiz = (extraDecisions?: Record<number, FamiliarityLevel>) => {
    const allResults = buildAllResults(extraDecisions);
    setState('completed');
    onQuizComplete(allResults);
  };

  // Handle familiarity selection — calls API, records decision, advances step
  const handleFamiliaritySelect = async (newFamiliarity: FamiliarityLevel) => {
    const pendingReminder = getPendingReminder();

    try {
      await apiService.updateWordFields(currentWord.id, {
        word: currentWord.word,
        familiarity: newFamiliarity,
        increment_count_practise: true,
        ...(pendingReminder !== undefined ? { reminder: pendingReminder } : {}),
      });

      recordDecision(currentWordIndex, newFamiliarity);
      resetReminder();

      if (isLastStep) {
        completeQuiz({ [currentWordIndex]: newFamiliarity });
      } else {
        advance();
      }
    } catch (error) {
      const errorMessage = 'Failed to update word. Please try again.';
      setError(errorMessage);
      if (onError) {
        const detailedMessage =
          error instanceof Error ? error.message : 'Unknown error';
        onError('Failed to update word familiarity: ' + detailedMessage);
      }
    }
  };

  const handleNext = () => {
    if (!showAnswer) {
      // Question page → show answer
      advance();
    } else if (isLastStep) {
      // Last answer page → treat as maintain, complete quiz
      completeQuiz();
    } else {
      // Answer page → record maintain if not yet decided, advance to next question
      if (decisions[currentWordIndex] === undefined) {
        recordDecision(currentWordIndex, currentWord.familiarity);
      }
      resetReminder();
      advance();
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      resetReminder();
      goBack();
    }
  };

  if (error) {
    return (
      <QuizErrorScreen
        error={error}
        onRetry={() => setError(null)}
        onBackToHome={onBackToHome}
      />
    );
  }

  if (state === 'loading') {
    return <QuizLoadingScreen />;
  }

  if (state === 'quiz' && currentWord) {
    const pronunciationUrls = currentWord.definitions?.[0]?.phonetics
      ? extractPronunciationUrls(currentWord.definitions[0].phonetics)
      : { uk: null, us: null };
    const hasUkUrl =
      !!pronunciationUrls.uk && isValidAudioUrl(pronunciationUrls.uk);
    const hasUsUrl =
      !!pronunciationUrls.us && isValidAudioUrl(pronunciationUrls.us);

    return (
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        <WordQuizNavHeader
          currentWordIndex={currentWordIndex}
          totalWords={words.length}
          progress={progress}
          isFirstStep={isFirstStep}
          showAnswer={showAnswer}
          currentWord={currentWord}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        {!showAnswer ? (
          // Stage 1: Word display only
          <div className='mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-y-auto'>
            <WordQuestionDisplay
              word={currentWord}
              pronunciationUrls={pronunciationUrls}
              hasUkUrl={hasUkUrl}
              hasUsUrl={hasUsUrl}
            />

            {/* Bottom Action */}
            <div className='flex-shrink-0 text-center'>
              <button
                onClick={handleNext}
                className='w-full rounded-lg bg-blue-500 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                Show Answer
              </button>
            </div>
          </div>
        ) : (
          // Stage 2: Word details and familiarity selection
          <div className='min-h-0 flex-1 overflow-y-auto'>
            <div className='mx-auto max-w-4xl'>
              {/* Word Display */}
              <div className='mb-8 text-center'>
                <p className='mb-4 text-xs text-gray-400 dark:text-gray-500'>
                  Practice #{currentWord.count_practise + 1}
                </p>
                {/* Pronunciation buttons */}
                <PronunciationControls
                  word={currentWord.word}
                  pronunciationUrls={pronunciationUrls}
                  hasUkUrl={hasUkUrl}
                  hasUsUrl={hasUsUrl}
                  className='mb-4 flex items-center justify-center space-x-4'
                />
              </div>

              {/* Word Details */}
              <WordDefinitionsPanel definitions={currentWord.definitions} />

              {/* Reminder Note Section */}
              <ReminderNoteInput
                enabled={reminderEnabled}
                text={reminderText}
                onEnabledChange={setReminderEnabled}
                onTextChange={setReminderText}
              />

              <div className='mb-6 text-center'>
                <p className='text-gray-600 dark:text-gray-400 lg:text-lg'>
                  How familiar are you with this word?
                </p>
              </div>

              {/* Familiarity Buttons */}
              <FamiliarityRatingButtons onSelect={handleFamiliaritySelect} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl py-12 text-center'>
      <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
        Quiz Completed
      </h3>
    </div>
  );
};
