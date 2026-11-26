import React, { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useQuestions } from '../../hooks/useQuestions';
import {
  useModalManager,
  MODAL_NAMES,
} from '../../hooks/shared/useModalManager';
import { EntityReviewTab } from '../shared/components/EntityReviewTab';
import { useUrlSyncedEntityList } from '../shared/hooks/useUrlSyncedEntityList';
import { QuizSetupModal } from '../shared/components/QuizSetupModal';
import { ActionButton } from '../../components/ui';
import { ModalLoadingFallback } from '../../components/ui/ModalLoadingFallback';
import { Question } from '../../types/api';

import { QuestionCard } from './QuestionCard';
import { QuestionFormModal } from './question-form/QuestionFormModal';

// Pulls in `recharts`, so it's only downloaded once the stats modal is
// actually opened rather than as part of the main bundle.
const QuestionStatsModal = lazy(() =>
  import('./QuestionStatsModal').then(m => ({
    default: m.QuestionStatsModal,
  })),
);

const SESSION_SEARCH_KEY = 'question-review-search';

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
  const [searchParams] = useSearchParams();
  const modalManager = useModalManager();
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Read the persisted search term from sessionStorage once on mount (clears when browser closes).
  const initialSessionTerm = useRef(
    sessionStorage.getItem(SESSION_SEARCH_KEY) ?? '',
  );

  const urlPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const initialUrlSort = useMemo(
    () => searchParams.get('sort') || '',
    [searchParams],
  );

  const questionsHook = useQuestions({
    itemsPerPage: 20,
    autoFetch: true,
    initialPage: urlPage,
    initialSearchTerm: initialSessionTerm.current,
    sort: initialUrlSort,
  });

  const {
    patchedHook: patchedQuestionsHook,
    urlSort,
    handleSortChange,
  } = useUrlSyncedEntityList({
    entityListHook: questionsHook,
    sessionSearchKey: SESSION_SEARCH_KEY,
    // This tab has no quick filters
    filtersKey: '',
  });

  const handleNew = () => {
    modalManager.openModal(MODAL_NAMES.ADD);
  };

  const handleCloseAddModal = () => {
    modalManager.closeModal(MODAL_NAMES.ADD);
  };

  // Refresh the list; if a new question was created, navigate to its detail page.
  const handleQuestionAdded = (newQuestion?: Question) => {
    // The `error` state (rendered by EntityReviewTab) already surfaces a
    // failed reload; refresh() can reject (see useEntityList.refresh), so
    // this is caught to avoid an unhandled promise rejection.
    questionsHook.refresh().catch(() => {});
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
    <div className='flex items-center justify-end gap-2'>
      <span className='text-sm text-gray-500 dark:text-gray-400'>Sort:</span>
      <ActionButton
        label={
          SORT_OPTIONS.find(opt => opt.value === urlSort)?.label ??
          SORT_OPTIONS[0].label
        }
        items={SORT_OPTIONS.map(opt => ({
          id: opt.value || 'default',
          label: opt.label,
          isSelected: opt.value === urlSort,
          onClick: () => handleSortChange(opt.value),
        }))}
      />
    </div>
  );

  return (
    <EntityReviewTab
      config={{
        title: 'Question Review',
        entityName: 'Question',
        entityNamePlural: 'Questions',
        enableSearch: true,
        searchPlaceholder: 'Search questions and options...',
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
      onTotalCountClick={() => setIsStatsOpen(true)}
      renderCard={(question, index) => (
        <QuestionCard
          key={question.id}
          index={index}
          question={question}
          className='hover:scale-[1.01]'
        />
      )}
      additionalContent={
        <>
          {/* Question Stats Modal */}
          {isStatsOpen && (
            <Suspense fallback={<ModalLoadingFallback />}>
              <QuestionStatsModal
                isOpen={isStatsOpen}
                onClose={() => setIsStatsOpen(false)}
              />
            </Suspense>
          )}

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
            defaultQuestionCount={10}
          />
        </>
      }
      className={className}
    />
  );
};
