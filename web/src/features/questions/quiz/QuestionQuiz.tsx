import React, { useState, useEffect, useCallback } from 'react';

import { QuestionQuizResult } from '../../../types/api';
import { calculateAccuracyRate } from '../question-detail/utils/accuracyCalculation';
import { QuizLoadingScreen } from '../../shared/components/QuizLoadingScreen';
import { apiService } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/apiErrorMessage';

import { OptionsSelectionList } from './components/OptionsSelectionList';
import { AnswerReviewList } from './components/AnswerReviewList';
import { ReferenceAndExplanation } from './components/ReferenceAndExplanation';
import { useQuestionQuizData } from './hooks/useQuestionQuizData';
import { useShuffledOptions } from './hooks/useShuffledOptions';

const formatAccuracy = (
  countPractise: number,
  countFailurePractise: number,
): string => {
  if (countPractise === 0) {
    return 'N/A';
  }
  return `${calculateAccuracyRate(countPractise, countFailurePractise)}%`;
};

const formatAccuracyWithCount = (
  countPractise: number,
  countFailurePractise: number,
): string => {
  const rate = formatAccuracy(countPractise, countFailurePractise);
  if (countPractise === 0) {
    return rate;
  }
  return `${rate} (${countPractise - countFailurePractise}/${countPractise})`;
};

export interface NextActionProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

interface QuestionQuizProps {
  questionCount: number;
  onQuizComplete: (results: QuestionQuizResult[]) => void;
  onBackToHome: () => void;
  onError?: (message: string) => void;
  onNextAction?: (action: NextActionProps | null) => void;
}

export const QuestionQuiz: React.FC<QuestionQuizProps> = ({
  questionCount,
  onQuizComplete,
  onBackToHome,
  onError,
  onNextAction,
}) => {
  const { state, setState, questions, error, setError } = useQuestionQuizData({
    questionCount,
    onError,
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionQuizResult[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const { shuffledOptions, shuffledAnswer } =
    useShuffledOptions(currentQuestion);
  const completedCount = currentQuestionIndex + (showAnswer ? 1 : 0);
  const progress =
    questions.length > 0 ? (completedCount / questions.length) * 100 : 0;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || selectedAnswer === null) {
      return;
    }

    const isCorrect = selectedAnswer === shuffledAnswer;
    const updatedStats = {
      countPractise: currentQuestion.count_practise + 1,
      countFailurePractise: isCorrect
        ? currentQuestion.count_failure_practise
        : currentQuestion.count_failure_practise + 1,
    };
    // selected_option must map back to the question's true option_a-d
    // lettering, not the shuffled position shown during the quiz.
    const selectedOption = shuffledOptions.find(
      option => option.key === selectedAnswer,
    )?.originalKey;

    try {
      await apiService.updateQuestion(currentQuestion.id, {
        question: currentQuestion.question,
        answer: currentQuestion.answer,
        option_a: currentQuestion.option_a,
        option_b: currentQuestion.option_b || '',
        option_c: currentQuestion.option_c || '',
        option_d: currentQuestion.option_d || '',
        notes: currentQuestion.notes,
        reference: currentQuestion.reference,
        count_practise: updatedStats.countPractise,
        count_failure_practise: updatedStats.countFailurePractise,
        practiced: true,
        selected_option: selectedOption,
      });

      const newResult: QuestionQuizResult = {
        question: currentQuestion,
        userAnswer: selectedAnswer,
        isCorrect,
        updatedStats,
      };

      setResults(prev => [...prev, newResult]);
      setShowAnswer(true);
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        'Failed to update question statistics.',
      );
      setError(errorMessage);
      if (onError) {
        onError('Failed to update question statistics: ' + errorMessage);
      }
    }
  }, [
    currentQuestion,
    selectedAnswer,
    shuffledAnswer,
    shuffledOptions,
    setError,
    onError,
  ]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
    } else {
      // Quiz completed
      setState('completed');
      onQuizComplete(results);
    }
  }, [
    currentQuestionIndex,
    questions.length,
    results,
    onQuizComplete,
    setState,
  ]);

  useEffect(() => {
    if (!onNextAction || !currentQuestion) {
      return;
    }
    if (showAnswer) {
      const label =
        currentQuestionIndex < questions.length - 1
          ? 'Next Question'
          : 'Finish Quiz';
      onNextAction({
        onClick: handleNextQuestion,
        label,
        className:
          'w-full rounded-lg bg-green-500 px-8 py-3 font-medium text-white transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 md:text-lg',
      });
    } else {
      onNextAction({
        onClick: handleSubmitAnswer,
        label: 'Submit Answer',
        disabled: !selectedAnswer,
        className:
          'w-full rounded-lg bg-blue-500 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-lg',
      });
    }
  }, [
    onNextAction,
    currentQuestion,
    showAnswer,
    selectedAnswer,
    currentQuestionIndex,
    questions.length,
    handleNextQuestion,
    handleSubmitAnswer,
  ]);

  if (error) {
    return (
      <div className='mx-auto max-w-2xl py-12 text-center'>
        <div className='mb-4 text-6xl text-red-500 dark:text-red-400'>⚠️</div>
        <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
          Quiz Error
        </h3>
        <p className='mb-6 text-gray-600 dark:text-gray-300'>{error}</p>
        <button
          onClick={onBackToHome}
          className='rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (state === 'loading') {
    return <QuizLoadingScreen />;
  }

  if (state === 'quiz' && currentQuestion && shuffledOptions.length > 0) {
    const isCorrect = results[results.length - 1]?.isCorrect ?? false;

    return (
      <div className='flex h-full flex-col'>
        {/* Progress Bar */}
        <div className='mb-6 flex-shrink-0'>
          <div className='mb-2 flex justify-between text-sm text-gray-600 dark:text-gray-400'>
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
            <div
              className='h-2 rounded-full bg-primary-500 transition-all duration-300'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {!showAnswer ? (
          // Stage 1: Question and options
          <>
            {/* Question Display */}
            <div className='flex flex-1 flex-col'>
              <div className='mb-8'>
                <h1 className='mb-1 text-xl font-bold leading-relaxed text-gray-900 dark:text-white lg:text-2xl'>
                  {currentQuestion.question}
                </h1>
                <p className='mb-6 text-xs text-gray-400 dark:text-gray-500'>
                  Accuracy:{' '}
                  {formatAccuracyWithCount(
                    currentQuestion.count_practise,
                    currentQuestion.count_failure_practise,
                  )}
                </p>

                {/* Options */}
                <OptionsSelectionList
                  options={shuffledOptions}
                  selectedAnswer={selectedAnswer}
                  onSelect={handleAnswerSelect}
                />
              </div>
            </div>
          </>
        ) : (
          // Stage 2: Answer and explanation
          <div className='flex-1 overflow-y-auto'>
            <div
              className={`mx-auto max-w-2xl border-l-4 pl-4 ${
                isCorrect ? 'border-green-400' : 'border-red-400'
              } lg:my-6`}
            >
              {/* Question Display */}
              <div className='mb-6'>
                <p className='mb-1 text-xs text-gray-400 dark:text-gray-500'>
                  #{currentQuestion.id}
                </p>
                <h1 className='mb-1 text-xl font-bold leading-relaxed text-gray-900 dark:text-white'>
                  {currentQuestion.question}
                </h1>
                <p className='mb-4 text-xs text-gray-400 dark:text-gray-500'>
                  Accuracy:{' '}
                  {formatAccuracyWithCount(
                    currentQuestion.count_practise,
                    currentQuestion.count_failure_practise,
                  )}{' '}
                  →{' '}
                  {formatAccuracyWithCount(
                    results[results.length - 1].updatedStats.countPractise,
                    results[results.length - 1].updatedStats
                      .countFailurePractise,
                  )}
                </p>

                {/* All Options (with correct answer highlighted) */}
                <AnswerReviewList
                  options={shuffledOptions}
                  selectedAnswer={selectedAnswer}
                  correctAnswer={shuffledAnswer}
                  isCorrect={isCorrect}
                />
              </div>

              <ReferenceAndExplanation
                reference={currentQuestion.reference}
                notes={currentQuestion.notes}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
