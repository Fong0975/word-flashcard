import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { QuestionQuizResult } from '../../../types/api';
import { DetailPageLayout } from '../../../components/layout';

import { QuestionQuiz, NextActionProps } from './QuestionQuiz';
import { QuestionQuizResults } from './QuestionQuizResults';

type PageState = 'quiz' | 'results';

const EXIT_CONFIRM_TITLE = 'Exit Quiz';
const EXIT_CONFIRM_MESSAGE =
  "Are you sure you want to exit the quiz? Your progress will be lost and you'll need to start over.";

export const QuestionQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const count = parseInt(searchParams.get('count') || '', 10);
  const isValidConfig = !isNaN(count) && count > 0;

  const [pageState, setPageState] = useState<PageState>('quiz');
  const [results, setResults] = useState<QuestionQuizResult[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [nextAction, setNextAction] = useState<NextActionProps | null>(null);

  // Intercept the browser back button by pushing a guard state into history,
  // then re-pushing it on every popstate so the user stays on the page.
  useEffect(() => {
    if (pageState !== 'quiz' || !isValidConfig) {
      return;
    }

    window.history.pushState(null, '');

    const handlePopState = () => {
      window.history.pushState(null, '');
      setShowExitConfirm(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pageState, isValidConfig]);

  // Show the browser's native dialog when the user tries to close or refresh the tab.
  useEffect(() => {
    if (pageState !== 'quiz' || !isValidConfig) {
      return;
    }
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pageState, isValidConfig]);

  const handleBackButton = () => {
    if (pageState === 'quiz') {
      setShowExitConfirm(true);
    } else {
      navigate('/?tab=questions');
    }
  };

  const handleExitConfirm = () => {
    setShowExitConfirm(false);
    navigate('/?tab=questions');
  };

  const handleExitCancel = () => {
    setShowExitConfirm(false);
  };

  const handleNextAction = useCallback(
    (action: { onClick: () => void; label: string } | null) => {
      setNextAction(action);
    },
    [],
  );

  const handleQuizComplete = (quizResults: QuestionQuizResult[]) => {
    setNextAction(null);
    setResults(quizResults);
    setPageState('results');
  };

  const handleRetakeQuiz = () => {
    setNextAction(null);
    setResults([]);
    setPageState('quiz');
  };

  const handleBackToHome = () => navigate('/?tab=questions');

  if (!isValidConfig) {
    return (
      <DetailPageLayout
        onBack={() => navigate('/?tab=questions')}
        body={
          <div className='flex flex-1 flex-col items-center justify-center'>
            <div className='mb-4 text-6xl'>😕</div>
            <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
              Invalid quiz configuration
            </h3>
            <button
              type='button'
              onClick={() => navigate('/?tab=questions')}
              className='mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700'
            >
              Back to Home
            </button>
          </div>
        }
      />
    );
  }

  return (
    <>
      <DetailPageLayout
        onBack={handleBackButton}
        body={
          <>
            {pageState === 'quiz' && (
              <div className='flex min-h-0 flex-1 flex-col'>
                <QuestionQuiz
                  questionCount={count}
                  onQuizComplete={handleQuizComplete}
                  onBackToHome={handleBackButton}
                  onNextAction={handleNextAction}
                />
              </div>
            )}

            {pageState === 'results' && (
              <QuestionQuizResults
                results={results}
                onRetakeQuiz={handleRetakeQuiz}
                onBackToHome={handleBackToHome}
              />
            )}
          </>
        }
        footer={
          pageState === 'quiz' && nextAction ? (
            <button
              onClick={nextAction.onClick}
              disabled={nextAction.disabled}
              className={nextAction.className}
            >
              {nextAction.label}
            </button>
          ) : pageState === 'results' ? (
            <div className='flex justify-center space-x-4'>
              <button
                onClick={handleRetakeQuiz}
                className='flex w-full items-center justify-center space-x-2 rounded-md bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='2'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
                  />
                </svg>
                <span>Again</span>
              </button>

              <button
                onClick={handleBackToHome}
                className='flex w-full items-center justify-center space-x-2 rounded-md bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='2'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'
                  />
                </svg>
                <span>Home</span>
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800'>
            <div className='mb-4 flex items-center'>
              <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
                <svg
                  className='h-6 w-6 text-red-600 dark:text-red-400'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='2'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                  {EXIT_CONFIRM_TITLE}
                </h3>
              </div>
            </div>
            <div className='mb-6'>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {EXIT_CONFIRM_MESSAGE}
              </p>
            </div>
            <div className='flex justify-end space-x-3'>
              <button
                type='button'
                onClick={handleExitCancel}
                className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              >
                Continue Quiz
              </button>
              <button
                type='button'
                onClick={handleExitConfirm}
                className='rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
              >
                Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
