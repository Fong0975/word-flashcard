import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import {
  Question,
  QuestionQuizResult,
  QuestionsRandomRequest,
} from '../../../types/api';
import { apiService } from '../../../lib/api';

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

type QuizState = 'loading' | 'quiz' | 'completed';

export const QuestionQuiz: React.FC<QuestionQuizProps> = ({
  questionCount,
  onQuizComplete,
  onBackToHome,
  onError,
  onNextAction,
}) => {
  const [state, setState] = useState<QuizState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionQuizResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const completedCount = currentQuestionIndex + (showAnswer ? 1 : 0);
  const progress =
    questions.length > 0 ? (completedCount / questions.length) * 100 : 0;

  // Fetch random questions for quiz
  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        setState('loading');
        setError(null);

        const request: QuestionsRandomRequest = {
          count: questionCount,
        };

        const fetchedQuestions = await apiService.getRandomQuestions(request);

        if (fetchedQuestions.length === 0) {
          setError(
            'No questions available for quiz. Please add some questions first.',
          );
          return;
        }

        setQuestions(fetchedQuestions);
        setState('quiz');
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to load quiz questions';
        setError(errorMessage);
        if (onError) {
          onError('Failed to fetch quiz questions: ' + errorMessage);
        }
      }
    };

    fetchQuizQuestions();
  }, [questionCount, onError]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAnswer, selectedAnswer, currentQuestionIndex, questions.length]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || selectedAnswer === null) {
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;

    const newResult: QuestionQuizResult = {
      question: currentQuestion,
      userAnswer: selectedAnswer,
      isCorrect,
      updatedStats: {
        countPractise: currentQuestion.count_practise + 1,
        countFailurePractise: isCorrect
          ? currentQuestion.count_failure_practise
          : currentQuestion.count_failure_practise + 1,
      },
    };

    const newResults = [...results, newResult];
    setResults(newResults);
    setShowAnswer(true);
  };

  const updateQuestionStatistics = async (results: QuestionQuizResult[]) => {
    try {
      for (const result of results) {
        const question = result.question;
        await apiService.updateQuestion(question.id, {
          question: question.question,
          answer: question.answer,
          option_a: question.option_a,
          option_b: question.option_b || '',
          option_c: question.option_c || '',
          option_d: question.option_d || '',
          notes: question.notes,
          reference: question.reference,
          count_practise: result.updatedStats.countPractise,
          count_failure_practise: result.updatedStats.countFailurePractise,
        });
      }
    } catch (error) {
      if (onError) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        onError('Failed to update question statistics: ' + errorMessage);
      }
      // Don't block the quiz completion on statistics update failure
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
    } else {
      // Quiz completed - update statistics first
      const finalResults = [...results];

      // Update question statistics in background
      updateQuestionStatistics(finalResults);

      // Complete quiz
      setState('completed');
      onQuizComplete(finalResults);
    }
  };

  // Get available options (filter out empty options)
  const getAvailableOptions = (question: Question) => {
    const options = [];
    if (question.option_a) {
      options.push({ key: 'A', value: question.option_a });
    }
    if (question.option_b) {
      options.push({ key: 'B', value: question.option_b });
    }
    if (question.option_c) {
      options.push({ key: 'C', value: question.option_c });
    }
    if (question.option_d) {
      options.push({ key: 'D', value: question.option_d });
    }
    return options;
  };

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
    return (
      <div className='mx-auto max-w-2xl py-12 text-center'>
        <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500'></div>
        <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
          Loading Quiz
        </h3>
        <p className='text-gray-600 dark:text-gray-300'>
          Preparing your quiz questions...
        </p>
      </div>
    );
  }

  if (state === 'quiz' && currentQuestion) {
    const availableOptions = getAvailableOptions(currentQuestion);
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
                <h1 className='mb-6 text-xl font-bold leading-relaxed text-gray-900 dark:text-white lg:text-2xl'>
                  {currentQuestion.question}
                </h1>

                {/* Options */}
                <div className='space-y-3'>
                  {availableOptions.map(option => (
                    <label
                      key={option.key}
                      className={`flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-colors lg:p-4 ${
                        selectedAnswer === option.key
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/20'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
                      } `}
                    >
                      <input
                        type='radio'
                        name='answer'
                        value={option.key}
                        checked={selectedAnswer === option.key}
                        onChange={e => handleAnswerSelect(e.target.value)}
                        className='mt-1 h-4 w-4 border-gray-300 bg-gray-100 text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600'
                      />
                      <div className='flex-1'>
                        <div className='flex items-start space-x-2'>
                          <span className='inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                            {option.key}
                          </span>
                          <span className='leading-relaxed text-gray-700 dark:text-gray-300'>
                            {option.value}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
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
                <h1 className='mb-1 text-xl font-bold leading-relaxed text-gray-900 dark:text-white'>
                  {currentQuestion.question}
                </h1>
                <p className='mb-4 text-xs text-gray-400 dark:text-gray-500'>
                  #{currentQuestion.id}
                </p>

                {/* All Options (with correct answer highlighted) */}
                <div className='mb-6 space-y-2'>
                  {availableOptions.map(option => {
                    const isUserWrongAnswer =
                      option.key === selectedAnswer && !isCorrect;
                    return (
                      <div
                        key={option.key}
                        className={`flex items-start space-x-3 rounded-lg p-3 ${
                          option.key === currentQuestion.answer
                            ? 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                            : isUserWrongAnswer
                              ? 'border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                              : 'bg-gray-50 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                            option.key === currentQuestion.answer
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : isUserWrongAnswer
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {option.key}
                        </span>
                        <span className='flex-1 leading-relaxed text-gray-700 dark:text-gray-300'>
                          {option.value}
                          {option.key === currentQuestion.answer && (
                            <span className='ml-2 font-medium text-green-600 dark:text-green-400'>
                              ✓ Correct
                            </span>
                          )}
                          {isUserWrongAnswer && (
                            <span className='ml-2 font-medium text-red-600 dark:text-red-400'>
                              ✗ Your Answer
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reference */}
              {currentQuestion.reference && (
                <div className='mb-6'>
                  <h3 className='mb-3 text-lg font-semibold text-gray-900 dark:text-white'>
                    Reference
                  </h3>
                  <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                      {currentQuestion.reference}
                    </p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {currentQuestion.notes && (
                <div className='mb-3'>
                  <h3 className='mb-3 text-lg font-semibold text-gray-900 dark:text-white'>
                    Explanation
                  </h3>
                  <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-700'>
                    <div className='prose prose-sm prose-slate max-w-none dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-400'>
                      <div className='prose prose-sm prose-slate max-w-none rounded dark:prose-invert prose-p:text-gray-600 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-500 prose-code:before:content-none prose-code:after:content-none dark:prose-p:text-gray-400 dark:prose-code:bg-gray-800 dark:prose-code:text-pink-400'>
                        <ReactMarkdown
                          remarkPlugins={[remarkBreaks, remarkGfm]}
                        >
                          {currentQuestion.notes.replace(/\\n/g, '\n')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
