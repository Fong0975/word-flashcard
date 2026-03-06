import React, {
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
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
import {
  QuizSetupModal,
  QuizSetupConfig,
} from '../shared/components/QuizSetupModal';
import { Word, BaseComponentProps } from '../../types';
import { SearchCondition, SearchOperation } from '../../types/base';

import { WordFormModal } from './word-form';
import { WordCard } from './WordCard';

interface WordsReviewTabProps extends BaseComponentProps {}

const SESSION_SEARCH_KEY = 'word-review-search';
const SESSION_QUICK_FILTERS_KEY = 'word-review-quick-filters';

export const WordsReviewTab: React.FC<WordsReviewTabProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalManager = useModalManager();
  const { toasts, showError, showWarning, removeToast } = useToast();

  // Active quick filter keys — restored from sessionStorage on mount.
  const [activeFilters, setActiveFilters] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_QUICK_FILTERS_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  const toggleFilter = useCallback((key: string) => {
    setActiveFilters(prev => {
      const next = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key];
      if (next.length > 0) {
        sessionStorage.setItem(SESSION_QUICK_FILTERS_KEY, JSON.stringify(next));
      } else {
        sessionStorage.removeItem(SESSION_QUICK_FILTERS_KEY);
      }
      return next;
    });
  }, []);

  // Read the persisted search term from sessionStorage once on mount (clears when browser closes).
  const initialSessionTerm = useRef(
    sessionStorage.getItem(SESSION_SEARCH_KEY) ?? '',
  );

  const urlPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  // Build extra filter conditions based on active quick filters
  const extraConditions = useMemo((): SearchCondition[] => {
    const conditions: SearchCondition[] = [];
    if (activeFilters.includes('withReminder')) {
      conditions.push(
        { key: 'reminder', operator: SearchOperation.IS_NOT_NULL },
        { key: 'reminder', operator: SearchOperation.IS_NOT_EMPTY },
      );
    }
    return conditions;
  }, [activeFilters]);

  const wordsHook = useWords({
    itemsPerPage: 30,
    autoFetch: true,
    initialPage: urlPage,
    initialSearchTerm: initialSessionTerm.current,
    extraConditions,
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

  // Stable string representation of active filters for use as an effect dep
  const activeFiltersKey = activeFilters.join(',');

  // Re-fetch from page 1 when quick filter conditions change
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    setUrlPage(1);
    fetchEntitiesRef.current(1);
  }, [activeFiltersKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleStartQuiz = (config: QuizSetupConfig) => {
    modalManager.closeModal(MODAL_NAMES.QUIZ_SETUP);
    const params = new URLSearchParams({ count: String(config.questionCount) });
    if (config.selectedFamiliarity && config.selectedFamiliarity.length > 0) {
      params.set('familiarity', config.selectedFamiliarity.join(','));
    }
    navigate(`/word/quiz?${params.toString()}`);
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
        quickFiltersContent={
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm text-gray-500 dark:text-gray-400'>
              Filters:
            </span>
            <button
              type='button'
              onClick={() => toggleFilter('withReminder')}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                activeFilters.includes('withReminder')
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {activeFilters.includes('withReminder') && (
                <svg
                  className='mr-1.5 h-3 w-3'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
              With Reminder
            </button>
          </div>
        }
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
          </>
        }
        className={className}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};
