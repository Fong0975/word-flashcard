import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useQuestions } from '../../hooks/useQuestions';
import {
  useModalManager,
  MODAL_NAMES,
} from '../../hooks/shared/useModalManager';
import { useToast } from '../../hooks/ui/useToast';
import { EntityReviewTab } from '../shared/components/EntityReviewTab';
import { QuizSetupModal } from '../shared/components/QuizSetupModal';
import { QuizModal } from '../../components/modals/QuizModal';
import { ToastContainer } from '../../components/ui';
import {
  Question,
  QuestionQuizConfig,
  QuestionQuizResult,
} from '../../types/api';

import { QuestionCard } from './QuestionCard';
import { QuestionFormModal } from './question-form/QuestionFormModal';
import { QuestionQuiz } from './quiz/QuestionQuiz';
import { QuestionQuizResults } from './quiz/QuestionQuizResults';

interface QuestionsReviewTabProps {
  className?: string;
}

export const QuestionsReviewTab: React.FC<QuestionsReviewTabProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalManager = useModalManager();
  const [quizConfig, setQuizConfig] = useState<QuestionQuizConfig | null>(null);
  const { toasts, showError, removeToast } = useToast();

  const urlPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const questionsHook = useQuestions({
    itemsPerPage: 20,
    autoFetch: true,
    initialPage: urlPage,
  });

  const setUrlPage = useCallback(
    (page: number) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (page <= 1) {
            next.delete('page');
          } else {
            next.set('page', page.toString());
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Keep a stable ref to fetchEntities to avoid stale closures in the effect below
  const fetchEntitiesRef = useRef(questionsHook.fetchEntities);
  fetchEntitiesRef.current = questionsHook.fetchEntities;

  // Keep a ref to current page to check inside the effect without adding it as a dep
  const currentPageRef = useRef(questionsHook.currentPage);
  currentPageRef.current = questionsHook.currentPage;

  // Sync URL → hook: when the URL page param changes externally (address bar, browser history),
  // fetch the corresponding page in the hook.
  useEffect(() => {
    if (urlPage !== currentPageRef.current) {
      fetchEntitiesRef.current(urlPage);
    }
  }, [urlPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrapped pagination actions: update URL only; the effect above handles the actual fetch.
  const wrappedGoToPage = useCallback(
    async (page: number) => {
      setUrlPage(page);
    },
    [setUrlPage],
  );

  const wrappedNextPage = useCallback(async () => {
    if (questionsHook.hasNext) {
      setUrlPage(urlPage + 1);
    }
  }, [questionsHook.hasNext, urlPage, setUrlPage]);

  const wrappedPreviousPage = useCallback(async () => {
    if (questionsHook.hasPrevious) {
      setUrlPage(urlPage - 1);
    }
  }, [questionsHook.hasPrevious, urlPage, setUrlPage]);

  const wrappedGoToFirst = useCallback(async () => {
    setUrlPage(1);
  }, [setUrlPage]);

  const wrappedGoToLast = useCallback(async () => {
    setUrlPage(questionsHook.totalPages);
  }, [questionsHook.totalPages, setUrlPage]);

  const patchedQuestionsHook = useMemo(
    () => ({
      ...questionsHook,
      goToPage: wrappedGoToPage,
      nextPage: wrappedNextPage,
      previousPage: wrappedPreviousPage,
      goToFirst: wrappedGoToFirst,
      goToLast: wrappedGoToLast,
    }),
    [
      questionsHook,
      wrappedGoToPage,
      wrappedNextPage,
      wrappedPreviousPage,
      wrappedGoToFirst,
      wrappedGoToLast,
    ],
  );

  const handleNew = () => {
    modalManager.openModal(MODAL_NAMES.ADD);
  };

  const handleCloseAddModal = () => {
    modalManager.closeModal(MODAL_NAMES.ADD);
  };

  // Refresh the list; if a new question was created, navigate to its detail page.
  const handleQuestionAdded = (newQuestion?: Question) => {
    questionsHook.refresh();
    if (newQuestion) {
      navigate(`/question/${newQuestion.id}`);
    }
  };

  const handleQuizSetup = () => {
    modalManager.openModal(MODAL_NAMES.QUIZ_SETUP);
  };

  const handleCloseQuizSetupModal = () => {
    modalManager.closeModal(MODAL_NAMES.QUIZ_SETUP);
  };

  const handleStartQuiz = (config: {
    questionCount: number;
    selectedFamiliarity?: string[];
  }) => {
    modalManager.closeModal(MODAL_NAMES.QUIZ_SETUP);
    modalManager.openModal(MODAL_NAMES.QUIZ, config);
    setQuizConfig({
      questionCount: config.questionCount,
    });
  };

  const handleCloseQuizModal = () => {
    modalManager.closeModal(MODAL_NAMES.QUIZ);
    setQuizConfig(null);
  };

  return (
    <>
      <EntityReviewTab
        config={{
          title: 'Question Review',
          entityName: 'Question',
          entityNamePlural: 'Questions',
          enableSearch: false,
          enableQuiz: true,
          emptyStateConfig: {
            icon: '🧠',
            title: 'No questions found',
            description:
              'This section provides review materials and random quizzes. You can practice various question types, including multiple-choice and fill-in-the-blank questions, and receive instant learning feedback.',
          },
        }}
        actions={{
          onNew: handleNew,
          onQuizSetup: handleQuizSetup,
          onRefresh: () => questionsHook.refresh(),
        }}
        entityListHook={patchedQuestionsHook}
        renderCard={(question, index) => (
          <QuestionCard
            key={question.id}
            index={index}
            question={question}
            className='transition-transform duration-200 hover:scale-[1.01]'
          />
        )}
        additionalContent={
          <>
            {/* Add Question Modal */}
            <QuestionFormModal
              isOpen={modalManager.isModalOpen(MODAL_NAMES.ADD)}
              onClose={handleCloseAddModal}
              onQuestionSaved={handleQuestionAdded}
              mode='create'
            />

            {/* Quiz Setup Modal */}
            <QuizSetupModal
              isOpen={modalManager.isModalOpen(MODAL_NAMES.QUIZ_SETUP)}
              onClose={handleCloseQuizSetupModal}
              onStartQuiz={handleStartQuiz}
              title='Question Quiz Setup'
              entityName='questions'
              enableFamiliaritySelection={false}
            />

            {/* Quiz Modal */}
            {quizConfig && (
              <QuizModal<QuestionQuizResult, QuestionQuizConfig>
                isOpen={modalManager.isModalOpen(MODAL_NAMES.QUIZ)}
                onClose={handleCloseQuizModal}
                quizConfig={quizConfig}
                config={{
                  quizTitle: 'Question Quiz',
                  resultsTitle: 'Quiz Results',
                  exitConfirmTitle: 'Exit Quiz',
                  exitConfirmMessage:
                    "Are you sure you want to exit the quiz? Your progress will be lost and you'll need to start over.",
                  exitButtonText: 'Exit Quiz',
                  continueButtonText: 'Continue Quiz',
                }}
                renderQuiz={(config, onComplete, onBackToHome) => (
                  <QuestionQuiz
                    questionCount={config.questionCount}
                    onQuizComplete={onComplete}
                    onBackToHome={onBackToHome}
                    onError={showError}
                  />
                )}
                renderResults={(results, onRetake, onBackToHome) => (
                  <QuestionQuizResults
                    results={results}
                    onRetakeQuiz={onRetake}
                    onBackToHome={onBackToHome}
                  />
                )}
              />
            )}
          </>
        }
        className={className}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};
