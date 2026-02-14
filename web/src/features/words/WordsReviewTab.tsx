import React, { useState, useEffect } from 'react';
import { useWords } from '../../hooks/useWords';
import { WordCard } from './WordCard';
import { Pagination } from '../../components/ui/Pagination';
import { ActionButton } from '../../components/ui/ActionButton';
import { WordFormModal } from './WordFormModal';
import { WordDetailModal } from './WordDetailModal';
import { QuizSetupModal } from './QuizSetupModal';
import { DefinitionFormModal } from './DefinitionFormModal';
import { QuizConfig, Word, WordDefinition } from '../../types/api';
import { QuizModal } from '../quiz/QuizModal';
import { apiService } from '../../lib/api';

interface WordsReviewTabProps {
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
  </div>
);

export const WordsReviewTab: React.FC<WordsReviewTabProps> = ({ className = '' }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuizSetupModalOpen, setIsQuizSetupModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);

  // WordDetailModal state
  const [isWordDetailModalOpen, setIsWordDetailModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  // DefinitionFormModal state
  const [isDefinitionFormModalOpen, setIsDefinitionFormModalOpen] = useState(false);
  const [definitionFormMode, setDefinitionFormMode] = useState<'add' | 'edit'>('add');
  const [selectedDefinition, setSelectedDefinition] = useState<WordDefinition | null>(null);

  const {
    words,
    loading,
    error,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    itemsPerPage,
    searchTerm,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    clearError,
    setSearchTerm,
  } = useWords({
    itemsPerPage: 50, // As per requirements
    autoFetch: true,
  });

  // Update selectedWord when words list changes (after refresh)
  useEffect(() => {
    if (selectedWord) {
      // Find the updated word in the current words list
      const updatedWord = words.find(w => w.id === selectedWord.id);
      if (updatedWord) {
        setSelectedWord(updatedWord);
      } else if (words.length > 0) {
        // If word is not found in current list (possibly due to filtering or pagination),
        // search for it explicitly using API
        const searchForUpdatedWord = async () => {
          try {
            const searchFilter = {
              key: 'word',
              operator: 'like',
              value: selectedWord.word,
            };

            const searchResults = await apiService.searchWords({
              searchFilter,
              limit: 1,
            });

            // Update the selected word if found
            if (searchResults.length > 0) {
              setSelectedWord(searchResults[0]);
            }
          } catch (error) {
            console.error('Failed to refresh selected word:', error);
          }
        };

        searchForUpdatedWord();
      }
    }
  }, [words, selectedWord?.id]); // Depend on words and selectedWord.id

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

  // Handle opening quiz setup modal
  const handleQuizSetup = () => {
    setIsQuizSetupModalOpen(true);
  };

  // Handle closing quiz setup modal
  const handleCloseQuizSetupModal = () => {
    setIsQuizSetupModalOpen(false);
  };

  // Handle starting quiz
  const handleStartQuiz = (selectedFamiliarity: string[], questionCount: number) => {
    // Close the setup modal
    setIsQuizSetupModalOpen(false);

    // Set quiz config and open quiz modal
    setQuizConfig({
      selectedFamiliarity,
      questionCount
    });
    setIsQuizModalOpen(true);
  };

  // Handle closing quiz modal
  const handleCloseQuizModal = () => {
    setIsQuizModalOpen(false);
    setQuizConfig(null);
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle opening WordDetailModal from WordFormModal suggestion
  const handleOpenWordDetailFromSuggestion = (word: Word) => {
    setSelectedWord(word);
    setIsWordDetailModalOpen(true);
  };

  // Handle closing WordDetailModal
  const handleCloseWordDetailModal = () => {
    setIsWordDetailModalOpen(false);
    setSelectedWord(null);
  };

  // Handle word updated (familiarity, word text, etc.)
  const handleWordUpdated = () => {
    refresh(); // Refresh the words list
  };

  // Handle opening DefinitionFormModal for adding new definition
  const handleOpenDefinitionModal = () => {
    setDefinitionFormMode('add');
    setSelectedDefinition(null);
    setIsDefinitionFormModalOpen(true);
  };

  // Handle opening DefinitionFormModal for editing definition
  const handleOpenEditDefinitionModal = (definition: WordDefinition) => {
    setDefinitionFormMode('edit');
    setSelectedDefinition(definition);
    setIsDefinitionFormModalOpen(true);
  };

  // Handle closing DefinitionFormModal
  const handleCloseDefinitionFormModal = () => {
    setIsDefinitionFormModalOpen(false);
    setDefinitionFormMode('add');
    setSelectedDefinition(null);
  };

  // Handle definition added successfully
  const handleDefinitionAdded = () => {
    refresh(); // Refresh the words list
  };

  // Handle definition updated successfully
  const handleDefinitionUpdated = () => {
    refresh(); // Refresh the words list
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Word Review
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Practice and test your vocabulary
        </p>
      </div>

      {/* Action Buttons */}
      {!loading && !error && (
        <div className="flex justify-end items-center space-x-3">

          {words.length > 0 && (
            <button
              onClick={handleQuizSetup}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600
                        rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.091zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              Quiz
            </button>
          )}

          <ActionButton
            label=""
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
        </div>
      )}

      {/* Error message */}
      {error && (
        <ErrorMessage
          error={error}
          onRetry={refresh}
          onDismiss={clearError}
        />
      )}

      {/* Search Input - Always visible unless there's an error */}
      {!error && (
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                        text-gray-900 dark:text-white bg-white dark:bg-gray-800
                        placeholder-gray-500 dark:placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        sm:text-sm transition-colors"
              placeholder="Search words..."
            />
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && words.length === 0 && <LoadingSpinner />}

      {/* Search no results */}
      {!loading && !error && words.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No words found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            No words match "{searchTerm}". Try a different search term.
          </p>
        </div>
      )}

      {/* Empty state - Only when no search term and no words */}
      {!loading && !error && words.length === 0 && !searchTerm && (
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
        onOpenWordDetail={handleOpenWordDetailFromSuggestion}
        mode="create"
        currentWords={words}
      />

      {/* Quiz Setup Modal */}
      <QuizSetupModal
        isOpen={isQuizSetupModalOpen}
        onClose={handleCloseQuizSetupModal}
        onStartQuiz={handleStartQuiz}
      />

      {/* Quiz Modal */}
      {quizConfig && (
        <QuizModal
          isOpen={isQuizModalOpen}
          onClose={handleCloseQuizModal}
          quizConfig={quizConfig}
        />
      )}

      {/* Word Detail Modal */}
      <WordDetailModal
        word={selectedWord}
        isOpen={isWordDetailModalOpen}
        onClose={handleCloseWordDetailModal}
        onWordUpdated={handleWordUpdated}
        onOpenDefinitionModal={handleOpenDefinitionModal}
        onOpenEditDefinitionModal={handleOpenEditDefinitionModal}
      />

      {/* Definition Form Modal */}
      <DefinitionFormModal
        isOpen={isDefinitionFormModalOpen}
        onClose={handleCloseDefinitionFormModal}
        onDefinitionAdded={handleDefinitionAdded}
        onDefinitionUpdated={handleDefinitionUpdated}
        wordId={selectedWord?.id || null}
        wordText={selectedWord?.word || null}
        mode={definitionFormMode}
        definition={selectedDefinition}
      />
    </div>
  );
};