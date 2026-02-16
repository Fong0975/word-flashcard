import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { QuestionQuiz } from './QuestionQuiz';
import { QuestionQuizResults } from './QuestionQuizResults';
import { QuestionQuizConfig, QuestionQuizResult } from '../../types/api';

interface QuestionQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizConfig: QuestionQuizConfig;
}

type QuizModalState = 'quiz' | 'results';

export const QuestionQuizModal: React.FC<QuestionQuizModalProps> = ({
  isOpen,
  onClose,
  quizConfig
}) => {
  const [state, setState] = useState<QuizModalState>('quiz');
  const [results, setResults] = useState<QuestionQuizResult[]>([]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleQuizComplete = (quizResults: QuestionQuizResult[]) => {
    setResults(quizResults);
    setState('results');
  };

  const handleRetakeQuiz = () => {
    setResults([]);
    setState('quiz');
  };

  const handleCloseRequest = () => {
    if (state === 'quiz') {
      // Show confirmation when in quiz mode
      setShowCloseConfirm(true);
    } else {
      // Direct close when viewing results
      handleCloseConfirm();
    }
  };

  const handleCloseConfirm = () => {
    setResults([]);
    setState('quiz');
    setShowCloseConfirm(false);
    onClose();
  };

  const handleCloseCancel = () => {
    setShowCloseConfirm(false);
  };

  const handleBackToHome = () => {
    handleCloseConfirm();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseRequest}
        title={state === 'quiz' ? 'Question Quiz' : 'Quiz Results'}
        maxWidth="2xl"
        disableBackdropClose={state === 'quiz'}
        disableEscapeClose={state === 'quiz'}
        className="max-h-[90vh] overflow-hidden"
      >
        <div className="h-[80vh] overflow-hidden">
          {state === 'quiz' && (
            <div className="h-full overflow-y-auto">
              <QuestionQuiz
                questionCount={quizConfig.questionCount}
                onQuizComplete={handleQuizComplete}
                onBackToHome={handleBackToHome}
              />
            </div>
          )}

          {state === 'results' && (
            <div className="h-full overflow-y-auto">
              <QuestionQuizResults
                results={results}
                onRetakeQuiz={handleRetakeQuiz}
                onBackToHome={handleBackToHome}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Close Confirmation Dialog */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Exit Quiz
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to exit the quiz? Your progress will be lost and you'll need to start over.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Continue Quiz
              </button>
              <button
                type="button"
                onClick={handleCloseConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
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