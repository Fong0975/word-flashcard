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
import { QuickFilterButton } from './QuickFilterButton';

interface WordsReviewTabProps extends BaseComponentProps {}

const SESSION_SEARCH_KEY = 'word-review-search';
const SESSION_QUICK_FILTERS_KEY = 'word-review-quick-filters';

const WORD_QUICK_FILTERS: readonly {
  key: string;
  label: string;
  dotClassName?: string;
}[] = [
  { key: 'familiarity:red', label: 'Unfamiliar', dotClassName: 'bg-red-500' },
  {
    key: 'familiarity:yellow',
    label: 'Somewhat Familiar',
    dotClassName: 'bg-yellow-500',
  },
  { key: 'familiarity:green', label: 'Familiar', dotClassName: 'bg-green-500' },
  { key: 'withReminder', label: 'With Reminder' },
];

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

    // Combine all selected familiarity values into a single IN condition
    const selectedFamiliarities = activeFilters
      .filter(k => k.startsWith('familiarity:'))
      .map(k => k.slice('familiarity:'.length));
    if (selectedFamiliarities.length > 0) {
      conditions.push({
        key: 'familiarity',
        operator: SearchOperation.IN,
        value: JSON.stringify(selectedFamiliarities),
      });
    }

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

  // Re-fetch from page 1 when quick filter conditions change.
  // Using a previousFiltersKeyRef instead of isFirstRenderRef to safely skip the
  // initial run, because React 18 StrictMode preserves ref values across its
  // mount→unmount→remount cycle, which caused isFirstRenderRef to be false on
  // the second run and trigger a spurious reset to page 1.
  const previousFiltersKeyRef = useRef(activeFiltersKey);
  useEffect(() => {
    if (activeFiltersKey === previousFiltersKeyRef.current) {
      return;
    }
    previousFiltersKeyRef.current = activeFiltersKey;
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
            {WORD_QUICK_FILTERS.map(filter => (
              <QuickFilterButton
                key={filter.key}
                label={filter.label}
                isActive={activeFilters.includes(filter.key)}
                onClick={() => toggleFilter(filter.key)}
                dotClassName={filter.dotClassName}
              />
            ))}
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
