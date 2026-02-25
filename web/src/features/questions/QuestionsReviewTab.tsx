import React, { useState } from 'react';
import { useQuestions } from '../../hooks/useQuestions';
import { QuestionCard } from './QuestionCard';
import { QuestionDetailModal } from './QuestionDetailModal';
import { QuestionFormModal } from './QuestionFormModal';
import { QuestionQuizSetupModal } from './QuestionQuizSetupModal';
import { QuestionQuizModal } from './QuestionQuizModal';
import { Pagination } from '../../components/ui/Pagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { EmptyState } from '../../components/ui/EmptyState';
import { Question, QuestionQuizConfig } from '../../types/api';

interface QuestionsReviewTabProps {
  className?: string;
}

export const QuestionsReviewTab: React.FC<QuestionsReviewTabProps> = ({ className = '' }) => {
  // Modal state for question detail
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isQuestionDetailModalOpen, setIsQuestionDetailModalOpen] = useState(false);

  // Modal state for adding new question
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Quiz modal states
  const [isQuizSetupModalOpen, setIsQuizSetupModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizConfig, setQuizConfig] = useState<QuestionQuizConfig | null>(null);

  const {
    questions,
    loading,
    error,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    itemsPerPage,
    totalCount,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    clearError,
  } = useQuestions({
    itemsPerPage: 20,
    autoFetch: true,
  });

  // Handle opening question detail modal
  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsQuestionDetailModalOpen(true);
  };

  // Handle closing question detail modal
  const handleCloseQuestionDetailModal = () => {
    setIsQuestionDetailModalOpen(false);
    setSelectedQuestion(null);
  };

  // Handle question updated
  const handleQuestionUpdated = () => {
    // Just refresh the questions list
    // The QuestionDetailModal will handle refreshing its own data
    refresh();
  };

  // Handle question refreshed from detail modal
  const handleQuestionRefreshed = (updatedQuestion: Question) => {
    setSelectedQuestion(updatedQuestion);
  };

  // Handle opening add question modal
  const handleNew = () => {
    setIsAddModalOpen(true);
  };

  // Handle closing add question modal
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Handle question added successfully - refresh the question list and open detail modal
  const handleQuestionAdded = (newQuestion?: Question) => {
    refresh();

    // If a new question was created, open the detail modal to show it
    if (newQuestion) {
      setSelectedQuestion(newQuestion);
      setIsQuestionDetailModalOpen(true);
    }
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
  const handleStartQuiz = (questionCount: number) => {
    // Close the setup modal
    setIsQuizSetupModalOpen(false);

    // Set quiz config and open quiz modal
    setQuizConfig({
      questionCount
    });
    setIsQuizModalOpen(true);
  };

  // Handle closing quiz modal
  const handleCloseQuizModal = () => {
    setIsQuizModalOpen(false);
    setQuizConfig(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Question Review
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Practice and test your knowledge with questions
        </p>
      </div>

      {/* Action Buttons */}
      {!loading && !error && (
        <div className="flex justify-end items-center space-x-3">
          {/* Quiz */}
          {questions.length > 0 && (
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

          {/* Refresh */}
          <button
            onClick={refresh}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md
                      border border-gray-300 dark:border-gray-600 shadow-sm
                      transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={loading}
          >
            <svg
              className="w-4 h-4 mr-2"
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
            Refresh
          </button>

          {/* Add */}
          <button
            onClick={handleNew}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md
                      border border-gray-300 dark:border-gray-600 shadow-sm
                      transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={loading}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <ErrorMessage
          error={error}
          onRetry={refresh}
          onDismiss={clearError}
          title="Error loading questions"
        />
      )}


      {/* Loading state */}
      {loading && questions.length === 0 && <LoadingSpinner message="Loading questions..." />}


      {/* Empty state - Only when no questions */}
      {!loading && !error && questions.length === 0 && (
        <EmptyState
          onRefresh={refresh}
          icon="🧠"
          title="No questions found"
          description="This section provides review materials and random quizzes. You can practice various question types, including multiple-choice and fill-in-the-blank questions, and receive instant learning feedback."
        />
      )}

      {/* Questions list */}
      {questions.length > 0 && (
        <>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <QuestionCard
                index={(currentPage - 1) * itemsPerPage + index + 1}
                key={question.id}
                question={question}
                className="transition-transform duration-200 hover:scale-[1.01]"
                onClick={() => handleQuestionClick(question)}
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
            totalItems={totalCount}
            onPageChange={goToPage}
            onNext={nextPage}
            onPrevious={previousPage}
            loading={loading}
            className="mt-8"
          />
        </>
      )}

      {/* Question Detail Modal */}
      <QuestionDetailModal
        question={selectedQuestion}
        isOpen={isQuestionDetailModalOpen}
        onClose={handleCloseQuestionDetailModal}
        onQuestionUpdated={handleQuestionUpdated}
        onQuestionRefreshed={handleQuestionRefreshed}
      />

      {/* Add Question Modal */}
      <QuestionFormModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onQuestionSaved={handleQuestionAdded}
        mode="create"
      />

      {/* Quiz Setup Modal */}
      <QuestionQuizSetupModal
        isOpen={isQuizSetupModalOpen}
        onClose={handleCloseQuizSetupModal}
        onStartQuiz={handleStartQuiz}
      />

      {/* Quiz Modal */}
      {quizConfig && (
        <QuestionQuizModal
          isOpen={isQuizModalOpen}
          onClose={handleCloseQuizModal}
          quizConfig={quizConfig}
        />
      )}
    </div>
  );
};