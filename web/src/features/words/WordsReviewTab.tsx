import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useWords } from '../../hooks/useWords';
import {
  useModalManager,
  MODAL_NAMES,
} from '../../hooks/shared/useModalManager';
import { useToast } from '../../hooks/ui/useToast';
import { EntityReviewTab } from '../shared/components/EntityReviewTab';
import { useQuickFilters } from '../shared/hooks/useQuickFilters';
import { useUrlSyncedEntityList } from '../shared/hooks/useUrlSyncedEntityList';
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
import { WordStatsModal } from './WordStatsModal';

interface WordsReviewTabProps extends BaseComponentProps {}

const SESSION_SEARCH_KEY = 'word-review-search';
const SESSION_QUICK_FILTERS_KEY = 'word-review-quick-filters';

const SORT_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'Alphabetical (reversed)', value: '-word' },
  { label: 'Practice count', value: 'count_practise,word' },
  { label: 'Practice count (reversed)', value: '-count_practise,word' },
] as const;

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
  const [searchParams] = useSearchParams();
  const modalManager = useModalManager();
  const { toasts, showError, showWarning, removeToast } = useToast();
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const { activeFilters, toggleFilter, filtersKey } = useQuickFilters(
    SESSION_QUICK_FILTERS_KEY,
  );

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
    sort: initialUrlSort,
  });

  const {
    patchedHook: patchedWordsHook,
    urlSort,
    handleSortChange,
  } = useUrlSyncedEntityList({
    entityListHook: wordsHook,
    sessionSearchKey: SESSION_SEARCH_KEY,
    filtersKey,
  });

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
    if (config.perCategoryCounts) {
      const params = new URLSearchParams();
      const { red, yellow, green } = config.perCategoryCounts;
      if (red > 0) {
        params.set('red', String(red));
      }
      if (yellow > 0) {
        params.set('yellow', String(yellow));
      }
      if (green > 0) {
        params.set('green', String(green));
      }
      navigate(`/word/quiz?${params.toString()}`);
    } else {
      const params = new URLSearchParams({
        count: String(config.questionCount),
      });
      if (config.selectedFamiliarity && config.selectedFamiliarity.length > 0) {
        params.set('familiarity', config.selectedFamiliarity.join(','));
      }
      navigate(`/word/quiz?${params.toString()}`);
    }
  };

  const handleOpenWordDetailFromSuggestion = (word: Word) => {
    navigate(`/word/${encodeURIComponent(word.word)}`);
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
        toolbarContent={sortToolbar}
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
        onTotalCountClick={() => setIsStatsOpen(true)}
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
            {/* Word Stats Modal */}
            <WordStatsModal
              isOpen={isStatsOpen}
              onClose={() => setIsStatsOpen(false)}
            />

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
