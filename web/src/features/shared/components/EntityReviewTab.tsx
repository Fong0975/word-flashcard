import React, { ReactNode } from 'react';

import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ToastContainer } from '../../../components/ui';
import {
  EntityListHook,
  BaseEntity,
  EntityReviewConfig,
  EntityReviewActions,
  BaseComponentProps,
} from '../../../types';
import { useDebouncedSearchInput } from '../hooks/useDebouncedSearchInput';
import { useRefreshAction } from '../hooks/useRefreshAction';

import { ReviewTabActionButtons } from './ReviewTabActionButtons';
import { EntityReviewSearchBar } from './EntityReviewSearchBar';
import { EntityListSection } from './EntityListSection';

interface EntityReviewTabProps<
  T extends BaseEntity,
> extends BaseComponentProps {
  readonly config: EntityReviewConfig;
  readonly actions: EntityReviewActions;
  readonly entityListHook: EntityListHook<T>;
  readonly renderCard: (entity: T, index: number) => ReactNode;
  readonly additionalContent?: ReactNode;
  readonly quickFiltersContent?: ReactNode;
  readonly toolbarContent?: ReactNode;
  readonly onTotalCountClick?: () => void;
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
  quickFiltersContent,
  toolbarContent,
  onTotalCountClick,
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

  const {
    inputValue,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    clearSearch,
  } = useDebouncedSearchInput({
    searchTerm,
    onCommit: term => {
      setSearchTerm(term);
      if (actions.onSearch) {
        actions.onSearch(term);
      }
    },
  });

  const { isRefreshing, handleRefresh, toasts, removeToast } = useRefreshAction(
    actions.onRefresh,
  );

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

        <ReviewTabActionButtons
          showQuiz={Boolean(
            config.enableQuiz && entities.length > 0 && actions.onQuizSetup,
          )}
          onQuizSetup={actions.onQuizSetup}
          onRefresh={actions.onRefresh ? handleRefresh : undefined}
          isRefreshing={isRefreshing}
          onNew={actions.onNew}
        />
      </div>

      {/* Toolbar (e.g. sort controls) */}
      {toolbarContent}

      {/* Search */}
      {config.enableSearch && (
        <EntityReviewSearchBar
          value={inputValue}
          onChange={handleChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onClear={clearSearch}
          placeholder={
            config.searchPlaceholder ||
            `Search ${config.entityNamePlural.toLowerCase()}...`
          }
          quickFiltersContent={quickFiltersContent}
        />
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
        <EntityListSection
          entities={entities}
          renderCard={renderCard}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalCount={totalCount}
          onTotalCountClick={onTotalCountClick}
          entityNamePlural={config.entityNamePlural}
          loading={loading}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onPageChange={goToPage}
          onNext={nextPage}
          onPrevious={previousPage}
          onFirst={goToFirst}
          onLast={goToLast}
        />
      )}

      {/* Additional Content (Modals, etc.) */}
      {additionalContent}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};
