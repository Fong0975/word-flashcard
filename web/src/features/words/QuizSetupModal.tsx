import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';

interface QuizSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz?: (selectedFamiliarity: string[], questionCount: number) => void;
}

const FAMILIARITY_OPTIONS = [
  {
    value: 'red',
    label: 'Red',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
  },
  {
    value: 'yellow',
    label: 'Yellow',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
  },
  {
    value: 'green',
    label: 'Green',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
  },
];

export const QuizSetupModal: React.FC<QuizSetupModalProps> = ({
  isOpen,
  onClose,
  onStartQuiz,
}) => {
  const [selectedFamiliarity, setSelectedFamiliarity] = useState<string[]>(['red']);
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleFamiliarityToggle = (value: string) => {
    setSelectedFamiliarity(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleStartQuiz = () => {
    if (selectedFamiliarity.length > 0 && questionCount > 0 && onStartQuiz) {
      onStartQuiz(selectedFamiliarity, questionCount);
    }
    handleCloseConfirm();
  };

  const handleCloseRequest = () => {
    setShowCloseConfirm(true);
  };

  const handleCloseConfirm = () => {
    setSelectedFamiliarity(['red', 'yellow', 'green']); // Reset to default
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
        title="Quiz Setup"
        maxWidth="md"
        disableBackdropClose={true}
        disableEscapeClose={true}
      >
      <div className="space-y-6">
        {/* Description */}
        <div className="text-gray-600 dark:text-gray-300">
          <p className="text-sm">
            Configure your quiz settings including the number of questions and familiarity levels.
          </p>
        </div>

        {/* Question Count */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of Questions
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={questionCount}
            onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter the number of questions for your quiz (1-100)
          </p>
        </div>

        {/* Familiarity Options */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Familiarity
          </div>

          {FAMILIARITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`
                flex items-center p-4 rounded-lg border cursor-pointer transition-colors
                ${selectedFamiliarity.includes(option.value)
                  ? `${option.bgColor} ring-2 ring-offset-2 ring-primary-500`
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }
              `}
            >
              <input
                type="checkbox"
                checked={selectedFamiliarity.includes(option.value)}
                onChange={() => handleFamiliarityToggle(option.value)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${option.color}`}>
                    {option.label}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${option.value === 'red' ? 'bg-red-500' : option.value === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Selection Count */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-blue-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {selectedFamiliarity.length === 0
                ? 'Please select at least one familiarity level'
                : `${selectedFamiliarity.length} familiarity level${selectedFamiliarity.length > 1 ? 's' : ''} selected`
              }
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleCloseRequest}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                       hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartQuiz}
            disabled={selectedFamiliarity.length === 0 || questionCount <= 0}
            className="px-6 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600
                       rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                       flex items-center space-x-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            <span>Start Quiz</span>
          </button>
        </div>
      </div>
      </Modal>

      {/* Close Confirmation Dialog */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
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
                  Cancel Quiz Setup
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to cancel the quiz setup? Any settings you've configured will be lost.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Keep Setting Up
              </button>
              <button
                type="button"
                onClick={handleCloseConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
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