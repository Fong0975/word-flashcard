import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useWords } from '../../hooks/useWords';
import {
  useModalManager,
  MODAL_NAMES,
} from '../../hooks/shared/useModalManager';
import { useToast } from '../../hooks/ui/useToast';
import { EntityReviewTab } from '../shared/components/EntityReviewTab';
import { ToastContainer } from '../../components/ui';
import { QuizSetupModal } from '../shared/components/QuizSetupModal';
import {
  WordQuizConfig as QuizConfig,
  Word,
  BaseComponentProps,
} from '../../types';
import { WordQuizResult } from '../../types/api';
import { FamiliarityLevel } from '../../types/base';
import { QuizModal } from '../../components/modals/QuizModal';

import { WordFormModal } from './word-form';
import { WordQuiz } from './quiz/WordQuiz';
import { WordQuizResults } from './quiz/WordQuizResults';
import { WordCard } from './WordCard';

interface WordsReviewTabProps extends BaseComponentProps {}

const SESSION_SEARCH_KEY = 'word-review-search';

export const WordsReviewTab: React.FC<WordsReviewTabProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalManager = useModalManager();
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const { toasts, showError, showWarning, removeToast } = useToast();

  // Read the persisted search term from sessionStorage once on mount (clears when browser closes).
  const initialSessionTerm = useRef(
    sessionStorage.getItem(SESSION_SEARCH_KEY) ?? '',
  );

  const urlPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const wordsHook = useWords({
    itemsPerPage: 30,
    autoFetch: true,
    initialPage: urlPage,
    initialSearchTerm: initialSessionTerm.current,
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
  const fetchEntitiesRef = useRef(wordsHook.fetchEntities);
  fetchEntitiesRef.current = wordsHook.fetchEntities;

  // Keep a ref to current page to check inside the effect without adding it as a dep
  const currentPageRef = useRef(wordsHook.currentPage);
  currentPageRef.current = wordsHook.currentPage;

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
    if (wordsHook.hasNext) {
      setUrlPage(urlPage + 1);
    }
  }, [wordsHook.hasNext, urlPage, setUrlPage]);

  const wrappedPreviousPage = useCallback(async () => {
    if (wordsHook.hasPrevious) {
      setUrlPage(urlPage - 1);
    }
  }, [wordsHook.hasPrevious, urlPage, setUrlPage]);

  const wrappedGoToFirst = useCallback(async () => {
    setUrlPage(1);
  }, [setUrlPage]);

  const wrappedGoToLast = useCallback(async () => {
    setUrlPage(wordsHook.totalPages);
  }, [wordsHook.totalPages, setUrlPage]);

  // When searching, clear the page param so results start from the first page,
  // and persist the search term in sessionStorage so it can be restored on back-navigation.
  const wrappedSetSearchTerm = useCallback(
    (term: string) => {
      if (term) {
        sessionStorage.setItem(SESSION_SEARCH_KEY, term);
      } else {
        sessionStorage.removeItem(SESSION_SEARCH_KEY);
      }
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.delete('page');
          return next;
        },
        { replace: true },
      );
      wordsHook.setSearchTerm(term);
    },
    [setSearchParams, wordsHook.setSearchTerm], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const patchedWordsHook = useMemo(
    () => ({
      ...wordsHook,
      goToPage: wrappedGoToPage,
      nextPage: wrappedNextPage,
      previousPage: wrappedPreviousPage,
      goToFirst: wrappedGoToFirst,
      goToLast: wrappedGoToLast,
      setSearchTerm: wrappedSetSearchTerm,
    }),
    [
      wordsHook,
      wrappedGoToPage,
      wrappedNextPage,
      wrappedPreviousPage,
      wrappedGoToFirst,
      wrappedGoToLast,
      wrappedSetSearchTerm,
    ],
  );

  const handleNew = () => {
    modalManager.openModal(MODAL_NAMES.ADD);
  };

  const handleCloseAddModal = () => {
    modalManager.closeModal(MODAL_NAMES.ADD);
  };

  const handleWordAdded = () => {
    wordsHook.refresh();
  };

  const handleQuizSetup = () => {
    modalManager.openModal(MODAL_NAMES.QUIZ_SETUP);
  };

  const handleCloseQuizSetupModal = () => {
    modalManager.closeModal(MODAL_NAMES.QUIZ_SETUP);
  };

  const handleStartQuiz = (config: {
    questionCount: number;
    selectedFamiliarity?: FamiliarityLevel[];
  }) => {
    modalManager.closeModal(MODAL_NAMES.QUIZ_SETUP);
    modalManager.openModal(MODAL_NAMES.QUIZ, config);

    setQuizConfig({
      selectedFamiliarity: config.selectedFamiliarity || [],
      questionCount: config.questionCount,
    });
  };

  const handleCloseQuizModal = () => {
    modalManager.closeModal(MODAL_NAMES.QUIZ);
    setQuizConfig(null);
  };

  const handleOpenWordDetailFromSuggestion = (word: Word) => {
    navigate(`/word/${encodeURIComponent(word.word)}`);
  };

  return (
    <>
      <EntityReviewTab
        config={{
          title: 'Word Review',
          entityName: 'Word',
          entityNamePlural: 'Words',
          enableSearch: true,
          enableQuiz: true,
          searchPlaceholder: 'Search words...',
          emptyStateConfig: {
            icon: '📚',
            title: 'No words found',
            description:
              'It looks like there are no words in your collection yet. Get started by adding your first word.',
          },
        }}
        actions={{
          onNew: handleNew,
          onQuizSetup: handleQuizSetup,
          onSearch: wordsHook.setSearchTerm,
          onRefresh: () => wordsHook.refresh(),
        }}
        entityListHook={patchedWordsHook}
        renderCard={(word, index) => (
          <WordCard
            key={word.id}
            index={index}
            word={word}
            className='transition-transform duration-200 hover:scale-[1.02]'
            onWordUpdated={wordsHook.refresh}
          />
        )}
        additionalContent={
          <>
            {/* Add Word Modal */}
            <WordFormModal
              isOpen={modalManager.isModalOpen(MODAL_NAMES.ADD)}
              onClose={handleCloseAddModal}
              onWordSaved={handleWordAdded}
              onOpenWordDetail={handleOpenWordDetailFromSuggestion}
              mode='create'
              currentWords={wordsHook.words}
              onError={showError}
              onWarning={showWarning}
            />

            {/* Quiz Setup Modal */}
            <QuizSetupModal
              isOpen={modalManager.isModalOpen(MODAL_NAMES.QUIZ_SETUP)}
              onClose={handleCloseQuizSetupModal}
              onStartQuiz={handleStartQuiz}
              title='Word Quiz Setup'
              entityName='words'
              enableFamiliaritySelection={true}
            />

            {/* Quiz Modal */}
            {quizConfig && (
              <QuizModal
                isOpen={modalManager.isModalOpen(MODAL_NAMES.QUIZ)}
                onClose={handleCloseQuizModal}
                quizConfig={quizConfig}
                config={{
                  quizTitle: 'Word Quiz',
                  resultsTitle: 'Quiz Results',
                  exitConfirmTitle: 'Exit Quiz',
                  exitConfirmMessage:
                    "Are you sure you want to exit the quiz? Your progress will be lost and you'll need to start over.",
                  exitButtonText: 'Exit Quiz',
                  continueButtonText: 'Continue Quiz',
                }}
                renderQuiz={(config, onComplete, onBackToHome) => (
                  <WordQuiz
                    selectedFamiliarity={config.selectedFamiliarity}
                    questionCount={config.questionCount}
                    onQuizComplete={onComplete}
                    onBackToHome={onBackToHome}
                    onError={showError}
                  />
                )}
                renderResults={(results, onRetake, onBackToHome) => (
                  <WordQuizResults
                    results={results as WordQuizResult[]}
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
