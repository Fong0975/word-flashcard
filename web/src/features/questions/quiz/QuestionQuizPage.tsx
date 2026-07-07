import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { QuestionQuizResult } from '../../../types/api';
import { DetailPageLayout } from '../../../components/layout';
import { useQuizExitGuard } from '../../shared/hooks/useQuizExitGuard';
import { QuizExitConfirmDialog } from '../../shared/components/QuizExitConfirmDialog';
import { QuizResultsFooter } from '../../shared/components/QuizResultsFooter';
import { InvalidQuizConfigScreen } from '../../shared/components/InvalidQuizConfigScreen';

import { QuestionQuiz, NextActionProps } from './QuestionQuiz';
import { QuestionQuizResults } from './QuestionQuizResults';

type PageState = 'quiz' | 'results';

export const QuestionQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const count = parseInt(searchParams.get('count') || '', 10);
  const isValidConfig = !isNaN(count) && count > 0;

  const [pageState, setPageState] = useState<PageState>('quiz');
  const [results, setResults] = useState<QuestionQuizResult[]>([]);
  const [nextAction, setNextAction] = useState<NextActionProps | null>(null);

  const handleBackToHome = () => navigate('/?tab=questions');

  const {
    showExitConfirm,
    handleBackButton,
    handleExitConfirm,
    handleExitCancel,
  } = useQuizExitGuard({
    isActive: pageState === 'quiz' && isValidConfig,
    onExit: handleBackToHome,
  });

  const handleNextAction = useCallback(
    (action: { onClick: () => void; label: string } | null) => {
      setNextAction(action);
    },
    [],
  );

  const handleQuizComplete = useCallback(
    (quizResults: QuestionQuizResult[]) => {
      setNextAction(null);
      setResults(quizResults);
      setPageState('results');
    },
    [],
  );

  const handleRetakeQuiz = () => {
    setNextAction(null);
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
