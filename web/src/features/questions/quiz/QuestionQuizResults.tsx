import React from 'react';
import { QuestionQuizResult } from '../../../types/api';

interface QuestionQuizResultsProps {
  results: QuestionQuizResult[];
  onRetakeQuiz: () => void;
  onBackToHome: () => void;
}

export const QuestionQuizResults: React.FC<QuestionQuizResultsProps> = ({
  results,
  onRetakeQuiz,
  onBackToHome
}) => {
  const totalQuestions = results.length;
  const correctAnswers = results.filter(result => result.isCorrect).length;
  const accuracyPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
    return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return 'Excellent! You have a great understanding of the material.';
    if (percentage >= 80) return 'Great job! Your performance is very good.';
    if (percentage >= 70) return 'Good work! You have a solid grasp of the concepts.';
    if (percentage >= 60) return 'Nice effort! Consider reviewing the questions you missed.';
    return 'Keep studying! Review the explanations and try again.';
  };

  return (
    <div className="max-w-4xl mx-auto pt-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">
          {accuracyPercentage >= 80 ? '🎉' : accuracyPercentage >= 60 ? '👍' : '📚'}
        </div>
        <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quiz Complete!
        </h1>
        <p className="lg:text-lg text-gray-600 dark:text-gray-300">
          {getPerformanceMessage(accuracyPercentage)}
        </p>
      </div>

      {/* Score Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
        <div className="text-center">
          <div className={`text-6xl font-bold mb-4 ${getScoreColor(accuracyPercentage)}`}>
            {accuracyPercentage}%
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full md:text-lg font-semibold border ${getScoreBadgeColor(accuracyPercentage)}`}>
            {correctAnswers} out of {totalQuestions} correct
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {correctAnswers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Correct
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totalQuestions - correctAnswers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Incorrect
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalQuestions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total
            </div>
          </div>
        </div>
      </div>

      {/* Question by Question Results */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 md:p-4 lg:p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Question Review
        </h2>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Question {index + 1}
                    </span>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      result.isCorrect
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </div>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium mb-3">
                    {result.question.question}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Your Answer:</span>
                      <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                        result.isCorrect
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {result.userAnswer || 'No answer'}
                      </div>
                    </div>

                    {!result.isCorrect && (
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Correct Answer:</span>
                        <div className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          {result.question.answer}
                        </div>
                      </div>
                    )}
                  </div>
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
                     rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     flex items-center justify-center space-x-2 w-full"
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
          <span>Again</span>
        </button>

        <button
          onClick={onBackToHome}
          className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                     hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                     flex items-center justify-center space-x-2 w-full"
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
          <span>Home</span>
        </button>
      </div>
    </div>
  );
};