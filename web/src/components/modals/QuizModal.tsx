/**
 * Generic quiz modal component for quiz execution and results display
 *
 * This component provides a common pattern for quiz modals with quiz/results states,
 * exit confirmation, and standardized navigation.
 */

import React, { ReactNode, useState } from 'react';

import { Modal } from '../ui/Modal';
import { BaseModalProps } from '../../types';

export interface QuizModalConfig {
  readonly quizTitle: string;
  readonly resultsTitle: string;
  readonly exitConfirmTitle: string;
  readonly exitConfirmMessage: string;
  readonly exitButtonText: string;
  readonly continueButtonText: string;
}

type QuizModalState = 'quiz' | 'results';

interface QuizModalProps<TQuizResult, TQuizConfig = unknown> extends BaseModalProps {
  readonly quizConfig: TQuizConfig; // Generic quiz configuration
  readonly config: QuizModalConfig;
  readonly renderQuiz: (config: TQuizConfig, onComplete: (results: TQuizResult[]) => void, onBackToHome: () => void) => ReactNode;
  readonly renderResults: (results: TQuizResult[], onRetake: () => void, onBackToHome: () => void) => ReactNode;
}

/**
 * Generic quiz modal component
 *
 * @example
 * ```tsx
 * <QuizModal
 *   isOpen={isQuizModalOpen}
 *   onClose={handleCloseModal}
 *   quizConfig={wordQuizConfig}
 *   config={{
 *     quizTitle: 'Word Quiz',
 *     resultsTitle: 'Quiz Results',
 *     exitConfirmTitle: 'Exit Quiz',
 *     exitConfirmMessage: 'Are you sure you want to exit the quiz? Your progress will be lost.',
 *     exitButtonText: 'Exit Quiz',
 *     continueButtonText: 'Continue Quiz'
 *   }}
 *   renderQuiz={(config, onComplete, onBackToHome) => (
 *     <WordQuiz
 *       selectedFamiliarity={config.selectedFamiliarity}
 *       questionCount={config.questionCount}
 *       onQuizComplete={onComplete}
 *       onBackToHome={onBackToHome}
 *     />
 *   )}
 *   renderResults={(results, onRetake, onBackToHome) => (
 *     <WordQuizResults
 *       results={results}
 *       onRetakeQuiz={onRetake}
 *       onBackToHome={onBackToHome}
 *     />
 *   )}
 * />
 * ```
 */
export const QuizModal = <TQuizResult extends unknown, TQuizConfig = unknown>({
  isOpen,
  onClose,
  quizConfig,
  config,
  renderQuiz,
  renderResults,
  title: modalTitle,
  ...modalProps
}: QuizModalProps<TQuizResult, TQuizConfig>) => {
  const [state, setState] = useState<QuizModalState>('quiz');
  const [results, setResults] = useState<TQuizResult[]>([]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleQuizComplete = (quizResults: TQuizResult[]) => {
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

  const title = modalTitle || (state === 'quiz' ? config.quizTitle : config.resultsTitle);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseRequest}
        title={title}
        maxWidth="2xl"
        disableBackdropClose={state === 'quiz'}
        disableEscapeClose={state === 'quiz'}
        className="max-h-[95vh] overflow-hidden flex flex-col"
        {...modalProps}
      >
        <div className="h-[80vh] overflow-hidden">
          {state === 'quiz' && (
            <div className="h-full overflow-x-hidden">
              {renderQuiz(quizConfig, handleQuizComplete, handleBackToHome)}
            </div>
          )}

          {state === 'results' && (
            <div className="h-full overflow-x-hidden">
              {renderResults(results, handleRetakeQuiz, handleBackToHome)}
            </div>
          )}
        </div>
      </Modal>

      {/* Exit Confirmation Dialog */}
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
                  {config.exitConfirmTitle}
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.exitConfirmMessage}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {config.continueButtonText}
              </button>
              <button
                type="button"
                onClick={handleCloseConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                {config.exitButtonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};