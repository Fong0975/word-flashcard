import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { WordQuizResult } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';
import { DetailPageLayout } from '../../../components/layout';
import { useQuizExitGuard } from '../../shared/hooks/useQuizExitGuard';
import { QuizExitConfirmDialog } from '../../shared/components/QuizExitConfirmDialog';
import { QuizResultsFooter } from '../../shared/components/QuizResultsFooter';
import { InvalidQuizConfigScreen } from '../../shared/components/InvalidQuizConfigScreen';

import { WordQuiz } from './WordQuiz';
import { WordQuizResults } from './WordQuizResults';

type PageState = 'quiz' | 'results';

export const WordQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const count = parseInt(searchParams.get('count') || '', 10);
  const familiarityParam = searchParams.get('familiarity') || '';
  const familiarity = useMemo(
    () =>
      familiarityParam
        ? (familiarityParam.split(',') as FamiliarityLevel[])
        : [],
    [familiarityParam],
  );

  const isCategoryMode =
    searchParams.has('red') ||
    searchParams.has('yellow') ||
    searchParams.has('green');

  const perCategoryCounts = useMemo(() => {
    if (!isCategoryMode) {
      return undefined;
    }
    return {
      red: parseInt(searchParams.get('red') ?? '0', 10) || 0,
      yellow: parseInt(searchParams.get('yellow') ?? '0', 10) || 0,
      green: parseInt(searchParams.get('green') ?? '0', 10) || 0,
    };
  }, [isCategoryMode, searchParams]);

  const isValidConfig = isCategoryMode
    ? !!perCategoryCounts && Object.values(perCategoryCounts).some(v => v > 0)
    : !isNaN(count) && count > 0 && familiarity.length > 0;

  const [pageState, setPageState] = useState<PageState>('quiz');
  const [results, setResults] = useState<WordQuizResult[]>([]);

  const handleBackToHome = () => navigate('/');

  const {
    showExitConfirm,
    handleBackButton,
    handleExitConfirm,
    handleExitCancel,
  } = useQuizExitGuard({
    isActive: pageState === 'quiz' && isValidConfig,
    onExit: handleBackToHome,
  });

  const handleQuizComplete = (quizResults: WordQuizResult[]) => {
    setResults(quizResults);
    setPageState('results');
  };

  const handleRetakeQuiz = () => {
    setResults([]);
    setPageState('quiz');
  };

  if (!isValidConfig) {
    return <InvalidQuizConfigScreen onBackToHome={handleBackToHome} />;
  }

  return (
    <>
      <DetailPageLayout
        onBack={handleBackButton}
        body={
          <>
            {pageState === 'quiz' && (
              <div className='flex min-h-0 flex-1 flex-col'>
                <WordQuiz
                  selectedFamiliarity={familiarity}
                  questionCount={count}
                  perCategoryCounts={perCategoryCounts}
                  onQuizComplete={handleQuizComplete}
                  onBackToHome={handleBackButton}
                />
              </div>
            )}

            {pageState === 'results' && (
              <WordQuizResults
                results={results}
                onRetakeQuiz={handleRetakeQuiz}
                onBackToHome={handleBackToHome}
              />
            )}
          </>
        }
        footer={
          pageState === 'results' ? (
            <QuizResultsFooter
              onRetakeQuiz={handleRetakeQuiz}
              onBackToHome={handleBackToHome}
            />
          ) : undefined
        }
      />

      <QuizExitConfirmDialog
        isOpen={showExitConfirm}
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />
    </>
  );
};
