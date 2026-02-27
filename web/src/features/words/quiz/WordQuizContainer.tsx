import React, { useState } from 'react';

import { WordQuizConfig, WordQuizResult } from '../../../types/api';

import { WordQuiz } from './WordQuiz';
import { WordQuizResults } from './WordQuizResults';

interface WordQuizContainerProps {
  onBackToHome: () => void;
  initialConfig?: WordQuizConfig | null;
}

type WordQuizContainerState = 'setup' | 'quiz' | 'results';

export const WordQuizContainer: React.FC<WordQuizContainerProps> = ({
  onBackToHome,
  initialConfig,
}) => {
  const [state, setState] = useState<WordQuizContainerState>(
    initialConfig ? 'quiz' : 'setup',
  );
  const [quizConfig, setWordQuizConfig] = useState<WordQuizConfig | null>(
    initialConfig || null,
  );
  const [results, setResults] = useState<WordQuizResult[]>([]);

  const handleQuizComplete = (quizResults: WordQuizResult[]) => {
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
    setWordQuizConfig(null);
    setState('setup');
    onBackToHome();
  };

  if (state === 'setup' || !quizConfig) {
    return (
      <div className='py-12 text-center'>
        <div className='mb-4 text-6xl'>🎯</div>
        <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
          Quiz Setup Required
        </h3>
        <p className='mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-300'>
          Please go to the Words tab and start a quiz from there.
        </p>
        <button
          onClick={handleBackToHome}
          className='rounded-md bg-primary-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600'
        >
          Go to Words
        </button>
      </div>
    );
  }

  if (state === 'quiz') {
    return (
      <WordQuiz
        selectedFamiliarity={quizConfig.selectedFamiliarity}
        questionCount={quizConfig.questionCount}
        onQuizComplete={handleQuizComplete}
        onBackToHome={handleBackToHome}
      />
    );
  }

  if (state === 'results') {
    return (
      <WordQuizResults
        results={results}
        onRetakeQuiz={handleRetakeQuiz}
        onBackToHome={handleBackToHome}
      />
    );
  }

  return null;
};
