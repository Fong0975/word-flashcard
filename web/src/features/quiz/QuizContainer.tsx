import React, { useState } from 'react';
import { Quiz } from './Quiz';
import { QuizResults } from './QuizResults';
import { QuizConfig, QuizResult } from '../../types/api';

interface QuizContainerProps {
  onBackToHome: () => void;
  initialConfig?: QuizConfig | null;
}

type QuizContainerState = 'setup' | 'quiz' | 'results';

export const QuizContainer: React.FC<QuizContainerProps> = ({
  onBackToHome,
  initialConfig
}) => {
  const [state, setState] = useState<QuizContainerState>(initialConfig ? 'quiz' : 'setup');
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(initialConfig || null);
  const [results, setResults] = useState<QuizResult[]>([]);

  const handleQuizComplete = (quizResults: QuizResult[]) => {
    setResults(quizResults);
    setState('results');
  };

  const handleRetakeQuiz = () => {
    if (quizConfig) {
      setResults([]);
      setState('quiz');
    }
  };

  const handleBackToHome = () => {
    setResults([]);
    setQuizConfig(null);
    setState('setup');
    onBackToHome();
  };

  if (state === 'setup' || !quizConfig) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Quiz Setup Required
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
          Please go to the Words tab and start a quiz from there.
        </p>
        <button
          onClick={handleBackToHome}
          className="px-6 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600
                     rounded-md transition-colors"
        >
          Go to Words
        </button>
      </div>
    );
  }

  if (state === 'quiz') {
    return (
      <Quiz
        selectedFamiliarity={quizConfig.selectedFamiliarity}
        questionCount={quizConfig.questionCount}
        onQuizComplete={handleQuizComplete}
        onBackToHome={handleBackToHome}
      />
    );
  }

  if (state === 'results') {
    return (
      <QuizResults
        results={results}
        onRetakeQuiz={handleRetakeQuiz}
        onBackToHome={handleBackToHome}
      />
    );
  }

  return null;
};