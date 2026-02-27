import React, { ReactNode, useState } from 'react';

import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ToastContainer } from '../../../components/ui';
import { useToast } from '../../../hooks/ui/useToast';
import {
  EntityListHook,
  BaseEntity,
  EntityReviewConfig,
  EntityReviewActions,
  BaseComponentProps,
} from '../../../types';

interface EntityReviewTabProps<
  T extends BaseEntity,
> extends BaseComponentProps {
  readonly config: EntityReviewConfig;
  readonly actions: EntityReviewActions;
  readonly entityListHook: EntityListHook<T>;
  readonly renderCard: (entity: T, index: number) => ReactNode;
  readonly additionalContent?: ReactNode; // For additional modals, etc.
}

/**
 * Generic EntityReviewTab component
 *
 * Provides a standardized layout and functionality for entity review pages.
 * Supports pagination, search, loading states, and quiz integration.
 *
 * @example
 * ```tsx
 * <EntityReviewTab
 *   config={{
 *     title: "Word Review",
 *     entityName: "word",
 *     entityNamePlural: "words",
 *     enableSearch: true,
 *     enableQuiz: true,
 *     searchPlaceholder: "Search words..."
 *   }}
 *   actions={{
 *     onNew: handleNew,
 *     onQuizSetup: handleQuizSetup,
 *     onSearch: setSearchTerm
 *   }}
 *   entityListHook={wordsHook}
 *   renderCard={(word, index) => (
 *     <WordCard key={word.id} word={word} index={index} />
 *   )}
 *   additionalContent={<>Modals here</>}
 * />
 * ```
 */
export const EntityReviewTab = <T extends BaseEntity>({
  config,
  actions,
  entityListHook,
  renderCard,
  additionalContent,
  className = '',
}: EntityReviewTabProps<T>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const {
    entities,
    loading,
    error,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    itemsPerPage,
    searchTerm,
    totalCount,
    nextPage,
    previousPage,
    goToPage,
    goToFirst,
    goToLast,
    refresh,
    clearError,
    setSearchTerm,
  } = entityListHook;

  const defaultEmptyState = {
    icon: '📝',
    title: `No ${config.entityNamePlural.toLowerCase()} found`,
    description: `Get started by adding your first ${config.entityName.toLowerCase()}.`,
  };

  const emptyStateConfig = config.emptyStateConfig || defaultEmptyState;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    if (actions.onSearch) {
      actions.onSearch(term);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);

      if (actions.onRefresh) {
        await actions.onRefresh();
      }

      showSuccess('Refresh successful!');
    } catch (error) {
      showError('Refresh failed, please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading state
  if (loading && entities.length === 0 && !searchTerm) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            {config.title}
          </h2>
        </div>
        <LoadingSpinner />
        {additionalContent}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          {config.title}
        </h2>
        <p className='mt-1 text-gray-600 dark:text-gray-300'>
          Manage and review your {config.entityNamePlural.toLowerCase()}
        </p>

        {/* Action Buttons */}
        <div className='mt-4 flex items-center justify-end space-x-3'>
          {/* Quiz Button */}
          {config.enableQuiz && entities.length > 0 && actions.onQuizSetup && (
            <button
              onClick={() => actions.onQuizSetup?.()}
              className='inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            >
              <svg
                className='mr-2 h-4 w-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                />
              </svg>
              Quiz
            </button>
          )}

          {/* Refresh Button */}
          {actions.onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              title='Refresh to get latest data'
            >
              {isRefreshing ? (
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current'></div>
              ) : (
                <svg
                  className='mr-2 h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
              )}
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}

          {/* Add Button */}
          {actions.onNew && (
            <button
              onClick={() => actions.onNew?.()}
              className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            >
              <svg
                className='mr-2 h-4 w-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 4v16m8-8H4'
                />
              </svg>
              Add
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {config.enableSearch && (
        <div className='mb-6'>
          <div className='relative'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <svg
                className='h-5 w-5 text-gray-400'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='2'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
            <input
              type='text'
              value={searchTerm}
              onChange={handleSearchChange}
              className='block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm'
              placeholder={
                config.searchPlaceholder ||
                `Search ${config.entityNamePlural.toLowerCase()}...`
              }
            />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <ErrorMessage
          error={error}
          onRetry={() => window.location.reload()}
          onDismiss={clearError}
        />
      )}

      {/* Empty State - No entities at all */}
      {!loading && entities.length === 0 && !searchTerm && (
        <EmptyState
          icon={emptyStateConfig.icon}
          title={emptyStateConfig.title}
          description={emptyStateConfig.description}
          onRefresh={refresh}
        />
      )}

      {/* Empty State - No search results */}
      {!loading && entities.length === 0 && searchTerm && (
        <div className='py-8 text-center'>
          <div className='mb-3 text-4xl'>🔍</div>
          <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-white'>
            No {config.entityNamePlural.toLowerCase()} found
          </h3>
          <p className='text-gray-600 dark:text-gray-300'>
            No {config.entityNamePlural.toLowerCase()} match "{searchTerm}". Try
            a different search term.
          </p>
        </div>
      )}

      {/* Entity List */}
      {entities.length > 0 && (
        <div>
          <div className='space-y-3'>
            {entities.map((entity, index) => (
              <div key={entity.id}>
                {renderCard(
                  entity,
                  (currentPage - 1) * itemsPerPage + index + 1,
                )}
              </div>
            ))}
          </div>

          {loading && (
            <div className='flex items-center justify-center rounded-lg bg-white/80 py-4 backdrop-blur-sm dark:bg-gray-900/80'>
              <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-primary-500'></div>
              <span className='ml-2 text-sm text-gray-600 dark:text-gray-400'>
                Loading...
              </span>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-8 flex justify-center'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                itemsPerPage={itemsPerPage}
                totalItems={totalCount}
                onPageChange={goToPage}
                onNext={nextPage}
                onPrevious={previousPage}
                onFirst={goToFirst}
                onLast={goToLast}
              />
            </div>
          )}
        </div>
      )}

      {/* Additional Content (Modals, etc.) */}
      {additionalContent}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};
