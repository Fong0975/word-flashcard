import React, { useState } from 'react';
import { useWords } from '../../hooks/useWords';
import { WordCard } from './WordCard';
import { Pagination } from '../../components/ui/Pagination';
import { ActionButton } from '../../components/ui/ActionButton';
import { WordFormModal } from './WordFormModal';

interface WordsReviewProps {
  className?: string;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading words...</span>
  </div>
);

const ErrorMessage: React.FC<{ error: string; onRetry: () => void; onDismiss: () => void }> = ({
  error,
  onRetry,
  onDismiss,
}) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg
          className="h-5 w-5 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
          Error loading words
        </h3>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
        <div className="mt-3 flex space-x-3">
          <button
            onClick={onRetry}
            className="bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-800 dark:text-red-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <button
            onClick={onDismiss}
            className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </div>
);

const EmptyState: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📚</div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      No words found
    </h3>
    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
      It looks like there are no words in your collection yet. Try adding some words or check your connection.
    </p>
    <button
      onClick={onRefresh}
      className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
    >
      Refresh
    </button>
  </div>
);

export const WordsReview: React.FC<WordsReviewProps> = ({ className = '' }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    words,
    loading,
    error,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    itemsPerPage,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    clearError,
  } = useWords({
    itemsPerPage: 50, // As per requirements
    autoFetch: true,
  });

  // Handle opening add word modal
  const handleNew = () => {
    setIsAddModalOpen(true);
  };

  // Handle closing add word modal
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Handle word added successfully - refresh the word list
  const handleWordAdded = () => {
    refresh();
  };

  // Action menu items
  const actionItems = [
    {
      id: 'new',
      label: 'New',
      onClick: handleNew,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
    },
    {
      id: 'refresh',
      label: 'Refresh',
      onClick: refresh,
      disabled: loading,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Word Review
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Practice with flashcards and test your vocabulary knowledge
          </p>
        </div>

        {!loading && !error && words.length > 0 && (
          <ActionButton
            label="Actions"
            items={actionItems}
            disabled={loading}
            icon={
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M12 6h.01M12 12h.01M12 18h.01"/>
              </svg>
            }
          />
        )}
      </div>

      {/* Error message */}
      {error && (
        <ErrorMessage
          error={error}
          onRetry={refresh}
          onDismiss={clearError}
        />
      )}

      {/* Loading state */}
      {loading && words.length === 0 && <LoadingSpinner />}

      {/* Empty state */}
      {!loading && !error && words.length === 0 && (
        <EmptyState onRefresh={refresh} />
      )}

      {/* Words list */}
      {words.length > 0 && (
        <>
          <div className="space-y-3">
            {words.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                className="transition-transform duration-200 hover:scale-[1.02]"
                onWordUpdated={refresh}
              />
            ))}
          </div>

          {/* Loading overlay for pagination */}
          {loading && (
            <div className="flex justify-center items-center py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            itemsPerPage={itemsPerPage}
            onPageChange={goToPage}
            onNext={nextPage}
            onPrevious={previousPage}
            loading={loading}
            className="mt-8"
          />
        </>
      )}

      {/* Add Word Modal */}
      <WordFormModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onWordSaved={handleWordAdded}
        mode="create"
      />
    </div>
  );
};