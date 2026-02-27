import React, { useState } from 'react';

import { Modal } from '../../../components/ui/Modal';

interface QuestionQuizSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz?: (questionCount: number) => void;
}

export const QuestionQuizSetupModal: React.FC<QuestionQuizSetupModalProps> = ({
  isOpen,
  onClose,
  onStartQuiz,
}) => {
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleStartQuiz = () => {
    if (questionCount > 0 && onStartQuiz) {
      onStartQuiz(questionCount);
    }
    handleCloseConfirm();
  };

  const handleCloseRequest = () => {
    setShowCloseConfirm(true);
  };

  const handleCloseConfirm = () => {
    setQuestionCount(15); // Reset to default
    setShowCloseConfirm(false);
    onClose();
  };

  const handleCloseCancel = () => {
    setShowCloseConfirm(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseRequest}
        title='Question Quiz Setup'
        maxWidth='md'
        disableBackdropClose={true}
        disableEscapeClose={true}
      >
        <div className='space-y-6'>
          {/* Description */}
          <div className='text-gray-600 dark:text-gray-300'>
            <p className='text-sm'>
              Configure your quiz settings. You'll be asked to answer multiple
              choice questions and view detailed explanations.
            </p>
          </div>

          {/* Question Count */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Number of Questions
            </label>
            <input
              type='number'
              min='1'
              max='100'
              value={questionCount}
              onChange={e =>
                setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))
              }
              className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
            />
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              Enter the number of questions for your quiz (1-100)
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end space-x-3 pt-4'>
            <button
              type='button'
              onClick={handleCloseRequest}
              className='rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleStartQuiz}
              disabled={questionCount <= 0}
              className='flex items-center space-x-2 rounded-md bg-primary-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
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
                  d='M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z'
                />
              </svg>
              <span>Start Quiz</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Close Confirmation Dialog */}
      {showCloseConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800'>
            <div className='mb-4 flex items-center'>
              <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900'>
                <svg
                  className='h-6 w-6 text-yellow-600 dark:text-yellow-400'
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
                  Cancel Quiz Setup
                </h3>
              </div>
            </div>
            <div className='mb-6'>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Are you sure you want to cancel the quiz setup? Any settings
                you've configured will be lost.
              </p>
            </div>
            <div className='flex justify-end space-x-3'>
              <button
                type='button'
                onClick={handleCloseCancel}
                className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              >
                Keep Setting Up
              </button>
              <button
                type='button'
                onClick={handleCloseConfirm}
                className='rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2'
              >
                Cancel Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
