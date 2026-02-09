import React from 'react';
import { QuizResult } from '../../types/api';

interface QuizResultsProps {
  results: QuizResult[];
  onRetakeQuiz: () => void;
  onBackToHome: () => void;
}

const getFamiliarityColor = (familiarity: string) => {
  switch (familiarity.toLowerCase()) {
    case 'green':
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-200',
        dot: 'bg-green-500'
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-200',
        dot: 'bg-yellow-500'
      };
    case 'red':
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-200',
        dot: 'bg-red-500'
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/20',
        text: 'text-gray-800 dark:text-gray-200',
        dot: 'bg-gray-500'
      };
  }
};

const FamiliarityBadge: React.FC<{ familiarity: string }> = ({ familiarity }) => {
  const colors = getFamiliarityColor(familiarity);

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <div className={`w-2 h-2 ${colors.dot} rounded-full mr-1`}></div>
      {familiarity.charAt(0).toUpperCase() + familiarity.slice(1)}
    </span>
  );
};

export const QuizResults: React.FC<QuizResultsProps> = ({
  results,
  onRetakeQuiz,
  onBackToHome
}) => {
  const totalQuestions = results.length;
  const changedCount = results.filter(result => result.oldFamiliarity !== result.newFamiliarity).length;
  const improvementCount = results.filter(result => {
    const oldLevel = result.oldFamiliarity === 'red' ? 0 : result.oldFamiliarity === 'yellow' ? 1 : 2;
    const newLevel = result.newFamiliarity === 'red' ? 0 : result.newFamiliarity === 'yellow' ? 1 : 2;
    return newLevel > oldLevel;
  }).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quiz Complete!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Great job! Here's a summary of your quiz results.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{totalQuestions}</div>
          <div className="text-sm text-blue-800 dark:text-blue-200">Total Questions</div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{changedCount}</div>
          <div className="text-sm text-green-800 dark:text-green-200">Familiarity Updated</div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{improvementCount}</div>
          <div className="text-sm text-purple-800 dark:text-purple-200">Improved Words</div>
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quiz Results ({totalQuestions} words)
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {results.map((result, index) => (
            <div key={result.word.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {result.word.word}
                    </h3>
                    {result.word.definitions && result.word.definitions.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {result.word.definitions[0].definition}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <FamiliarityBadge familiarity={result.oldFamiliarity} />

                  <div className="text-gray-400 dark:text-gray-600">
                    →
                  </div>

                  <FamiliarityBadge familiarity={result.newFamiliarity} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onRetakeQuiz}
          className="px-6 py-3 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600
                     rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     flex items-center space-x-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span>Take Quiz Again</span>
        </button>

        <button
          onClick={onBackToHome}
          className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                     hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                     flex items-center space-x-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
};