import React, { ReactNode } from 'react';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  EntityListHook,
  BaseEntity,
  EntityReviewConfig,
  EntityReviewActions,
  BaseComponentProps
} from '../../../types';

interface EntityReviewTabProps<T extends BaseEntity> extends BaseComponentProps {
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

  // Show loading state
  if (loading && entities.length === 0 && !searchTerm) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {config.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage and review your {config.entityNamePlural.toLowerCase()}
        </p>

        {/* Action Buttons */}
        <div className="flex justify-end items-center space-x-3 mt-4">
          {/* Quiz Button */}
          {config.enableQuiz && entities.length > 0 && actions.onQuizSetup && (
            <button
              onClick={() => actions.onQuizSetup?.()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600
                         rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Quiz
            </button>
          )}

          {/* Refresh Button */}
          {actions.onRefresh && (
            <button
              onClick={() => actions.onRefresh?.()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800
                         hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm transition-colors
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              title="Refresh to get latest data"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}

          {/* Add Button */}
          {actions.onNew && (
            <button
              onClick={() => actions.onNew?.()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800
                         hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm transition-colors
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {config.enableSearch && (
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         sm:text-sm"
              placeholder={config.searchPlaceholder || `Search ${config.entityNamePlural.toLowerCase()}...`}
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
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No {config.entityNamePlural.toLowerCase()} found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            No {config.entityNamePlural.toLowerCase()} match "{searchTerm}". Try a different search term.
          </p>
        </div>
      )}

      {/* Entity List */}
      {entities.length > 0 && (
        <div>
          <div className="space-y-3">
            {entities.map((entity, index) => (
              <div key={entity.id}>
                {renderCard(entity, (currentPage - 1) * itemsPerPage + index + 1)}
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
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
    </div>
  );
};