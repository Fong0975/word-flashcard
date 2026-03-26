import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useQuestions } from '../../hooks/useQuestions';
import {
  useModalManager,
  MODAL_NAMES,
} from '../../hooks/shared/useModalManager';
import { EntityReviewTab } from '../shared/components/EntityReviewTab';
import { QuizSetupModal } from '../shared/components/QuizSetupModal';
import { Question } from '../../types/api';

import { QuestionCard } from './QuestionCard';
import { QuestionFormModal } from './question-form/QuestionFormModal';

const SORT_OPTIONS = [
  { label: 'Default', value: '' },
  {
    label: 'Familiarity (reversed)',
    value: '-(count_failure_practise/count_practise),-count_failure_practise',
  },
  { label: 'Practice count', value: 'count_practise' },
  { label: 'Practice count (reversed)', value: '-count_practise' },
] as const;

interface QuestionsReviewTabProps {
  className?: string;
}

export const QuestionsReviewTab: React.FC<QuestionsReviewTabProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalManager = useModalManager();

  const urlPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const urlSort = useMemo(() => searchParams.get('sort') || '', [searchParams]);

  const questionsHook = useQuestions({
    itemsPerPage: 20,
    autoFetch: true,
    initialPage: urlPage,
    sort: urlSort,
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

  // Sync URL → hook: when the sort param changes, reset to page 1 and refetch.
  const prevSortRef = useRef(urlSort);
  useEffect(() => {
    if (urlSort !== prevSortRef.current) {
      prevSortRef.current = urlSort;
      fetchEntitiesRef.current(1);
    }
  }, [urlSort]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSortChange = useCallback(
    (value: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.delete('page');
          if (value) {
            next.set('sort', value);
          } else {
            next.delete('sort');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
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

  const handleStartQuiz = (config: { questionCount: number }) => {
    modalManager.closeModal(MODAL_NAMES.QUIZ_SETUP);
    navigate(`/question/quiz?count=${config.questionCount}`);
  };

  const sortToolbar = (
    <div className='flex items-center justify-end'>
      <select
        value={urlSort}
        onChange={e => handleSortChange(e.target.value)}
        className='rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
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
      toolbarContent={sortToolbar}
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
        </>
      }
      className={className}
    />
  );
};
