import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { DetailPageLayout } from '../../components/layout';
import { useLogUnread } from '../../contexts/LogUnreadContext';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Pagination } from '../../components/ui/Pagination';
import { useLogs } from '../../hooks/useLogs';
import { LogLevel } from '../../types/logs';
import { useDebouncedSearchInput } from '../shared/hooks/useDebouncedSearchInput';
import { useQuickFilters } from '../shared/hooks/useQuickFilters';
import { useUrlSyncedEntityList } from '../shared/hooks/useUrlSyncedEntityList';

import { LogEntryItem } from './components/LogEntryItem';
import { LogFilters } from './components/LogFilters';
import { isLogLevel } from './utils/isLogLevel';

const SESSION_LEVELS_KEY = 'log-view-levels';
const SESSION_SEARCH_KEY = 'log-view-search';
const ITEMS_PER_PAGE = 50;

/**
 * Backend log viewer.
 *
 * Entries come from the current log file plus its rotated siblings, newest
 * first. Paging goes through the URL (`?page=`) via the shared
 * `useUrlSyncedEntityList`, so a reload or back-navigation lands on the same
 * page.
 */
export const LogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { markRead } = useLogUnread();

  // Opening the page counts as having seen the logs, so the watermark is
  // advanced immediately. It is global: it ignores whatever level or date
  // filter happens to be applied, marking everything written before now as
  // read.
  useEffect(() => {
    markRead();
  }, [markRead]);

  const urlPage = useMemo(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(page) || page < 1 ? 1 : page;
  }, [searchParams]);

  const {
    activeFilters,
    toggleFilter,
    filtersKey: levelsKey,
  } = useQuickFilters(SESSION_LEVELS_KEY);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [keyword, setKeyword] = useState('');
  const {
    inputValue: keywordInputValue,
    handleChange: handleKeywordChange,
    handleCompositionStart: handleKeywordCompositionStart,
    handleCompositionEnd: handleKeywordCompositionEnd,
    clearSearch: clearKeyword,
  } = useDebouncedSearchInput({ searchTerm: keyword, onCommit: setKeyword });

  // Stale sessionStorage could hold a key that is no longer a level, so the
  // selection is narrowed before it reaches the API.
  const levels = useMemo(
    () => activeFilters.filter(isLogLevel),
    [activeFilters],
  );

  // Any filter change must reset paging, not just the level pills.
  const filtersKey = `${levelsKey}|${from}|${to}|${keyword}`;

  const logsHook = useLogs({
    itemsPerPage: ITEMS_PER_PAGE,
    initialPage: urlPage,
    levels,
    from: from || undefined,
    to: to || undefined,
    keyword: keyword || undefined,
  });

  const { patchedHook } = useUrlSyncedEntityList({
    entityListHook: logsHook,
    sessionSearchKey: SESSION_SEARCH_KEY,
    filtersKey,
  });

  const {
    entities: logs,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,
    goToPage,
    nextPage,
    previousPage,
    goToFirst,
    goToLast,
    refresh,
    clearError,
  } = patchedHook;

  const header = (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h1 className='text-lg font-semibold text-gray-900 dark:text-white'>
          Backend Logs
        </h1>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-gray-500 dark:text-gray-400'>
            {totalCount} entries
          </span>
          <button
            type='button'
            onClick={() => refresh()}
            disabled={loading}
            aria-label='Refresh logs'
            title='Refresh'
            className='rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
          >
            <svg
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth={2}
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          </button>
        </div>
      </div>
      <LogFilters
        activeLevels={activeFilters}
        onToggleLevel={(level: LogLevel) => toggleFilter(level)}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        keyword={keywordInputValue}
        onKeywordChange={handleKeywordChange}
        onKeywordCompositionStart={handleKeywordCompositionStart}
        onKeywordCompositionEnd={handleKeywordCompositionEnd}
        onKeywordClear={clearKeyword}
      />
    </div>
  );

  const renderBody = (): React.ReactNode => {
    if (error) {
      return (
        <ErrorMessage
          error={error}
          onRetry={refresh}
          onDismiss={clearError}
          title='Error loading logs'
        />
      );
    }

    if (loading && logs.length === 0) {
      return (
        <div className='flex flex-1 items-center justify-center'>
          <LoadingSpinner />
        </div>
      );
    }

    if (logs.length === 0) {
      return (
        <EmptyState
          onRefresh={refresh}
          icon='📋'
          title='No log entries'
          description='No entries match the current filters.'
        />
      );
    }

    return (
      <ul className='divide-y divide-gray-100 dark:divide-gray-700'>
        {logs.map(entry => (
          <LogEntryItem key={entry.id} entry={entry} />
        ))}
      </ul>
    );
  };

  return (
    <DetailPageLayout
      onBack={() => navigate('/')}
      header={header}
      body={renderBody()}
      footer={
        totalPages > 1 ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            onPageChange={goToPage}
            onNext={nextPage}
            onPrevious={previousPage}
            onFirst={goToFirst}
            onLast={goToLast}
            loading={loading}
          />
        ) : undefined
      }
    />
  );
};
