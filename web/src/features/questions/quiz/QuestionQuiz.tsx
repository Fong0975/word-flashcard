import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

import {
  Question,
  QuestionQuizResult,
  QuestionsRandomRequest,
} from '../../../types/api';
import { apiService } from '../../../lib/api';

interface QuestionQuizProps {
  questionCount: number;
  onQuizComplete: (results: QuestionQuizResult[]) => void;
  onBackToHome: () => void;
  onError?: (message: string) => void;
}

type QuizState = 'loading' | 'quiz' | 'completed';

export const QuestionQuiz: React.FC<QuestionQuizProps> = ({
  questionCount,
  onQuizComplete,
  onBackToHome,
  onError,
}) => {
  const [state, setState] = useState<QuizState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionQuizResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + (showAnswer ? 0.5 : 0)) / questions.length) *
        100
      : 0;

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

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || selectedAnswer === null) {
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;

    // Add result to results array
    const newResult: QuestionQuizResult = {
      question: currentQuestion,
      userAnswer: selectedAnswer,
      isCorrect,
    };

    const newResults = [...results, newResult];
    setResults(newResults);
    setShowAnswer(true);
  };

  // Update question statistics after quiz completion
  const updateQuestionStatistics = async (results: QuestionQuizResult[]) => {
    try {
      // Update each question's statistics
      for (const result of results) {
        const question = result.question;

        // Calculate new statistics
        const newCountPractise = question.count_practise + 1;
        const newCountFailurePractise = result.isCorrect
          ? question.count_failure_practise
          : question.count_failure_practise + 1;

        // Update question with new statistics (preserve all other fields)
        await apiService.updateQuestion(question.id, {
          question: question.question,
          answer: question.answer,
          option_a: question.option_a,
          option_b: question.option_b || '',
          option_c: question.option_c || '',
          option_d: question.option_d || '',
          notes: question.notes,
          reference: question.reference,
          count_practise: newCountPractise,
          count_failure_practise: newCountFailurePractise,
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

            {/* Bottom Action */}
            <div className='flex-shrink-0 text-center'>
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className='w-full rounded-lg bg-blue-500 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-lg'
              >
                Submit Answer
              </button>
            </div>
          </>
        ) : (
          // Stage 2: Answer and explanation
          <div className='flex-1 overflow-y-auto'>
            <div className='mx-auto max-w-2xl'>
              {/* Question Display */}
              <div className='mb-6'>
                <h1 className='mb-4 text-xl font-bold leading-relaxed text-gray-900 dark:text-white'>
                  {currentQuestion.question}
                </h1>

                {/* User's Answer vs Correct Answer */}
                <div className='mb-6 space-y-3'>
                  <div className='flex items-center space-x-4'>
                    <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                      Your Answer:
                    </span>
                    <div
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        results[results.length - 1]?.isCorrect
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                      }`}
                    >
                      {selectedAnswer}
                      {results[results.length - 1]?.isCorrect ? ' ✓' : ' ✗'}
                    </div>
                  </div>

                  {!results[results.length - 1]?.isCorrect && (
                    <div className='flex items-center space-x-4'>
                      <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                        Correct Answer:
                      </span>
                      <div className='inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/20 dark:text-green-200'>
                        {currentQuestion.answer}
                      </div>
                    </div>
                  )}
                </div>

                {/* All Options (with correct answer highlighted) */}
                <div className='mb-6 space-y-2'>
                  {availableOptions.map(option => (
                    <div
                      key={option.key}
                      className={`flex items-start space-x-3 rounded-lg p-3 ${
                        option.key === currentQuestion.answer
                          ? 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                          option.key === currentQuestion.answer
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
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
                      </span>
                    </div>
                  ))}
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
                <div className='mb-8'>
                  <h3 className='mb-3 text-lg font-semibold text-gray-900 dark:text-white'>
                    Explanation
                  </h3>
                  <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-700'>
                    <div className='prose prose-sm prose-slate max-w-none dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-400'>
                      <div className='/* 1. Remove the default backticks */ /* 2. Add special markup styles (e.g., gray background, pink text, corners) */ prose prose-sm prose-slate max-w-none rounded dark:prose-invert prose-p:text-gray-600 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-500 prose-code:before:content-none prose-code:after:content-none dark:prose-p:text-gray-400 dark:prose-code:bg-gray-800 dark:prose-code:text-pink-400'>
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                          {currentQuestion.notes.replace(/\\n/g, '\n')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Button */}
              <div className='pb-2 text-center md:pb-4 lg:pb-8'>
                <button
                  onClick={handleNextQuestion}
                  className='w-full rounded-lg bg-green-500 px-8 py-3 font-medium text-white transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 md:text-lg'
                >
                  {currentQuestionIndex < questions.length - 1
                    ? 'Next Question'
                    : 'Finish Quiz'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
