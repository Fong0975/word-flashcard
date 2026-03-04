import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiService } from '../../../lib/api';
import { Question } from '../../../types/api';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { QuestionFormModal } from '../question-form/QuestionFormModal';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';

import { useQuestionActions } from './hooks/useQuestionActions';
import { useQuestionStats } from './hooks/useQuestionStats';
import {
  QuestionHeader,
  OptionsDisplay,
  PracticeStats,
  AnswerSection,
  QuestionFooter,
} from './components';

export const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAnswerExpanded, setIsAnswerExpanded] = useState(false);

  const fetchQuestion = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(null);
      const q = await apiService.getQuestion(Number(id));
      setQuestion(q);
    } catch {
      setFetchError('Failed to load question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const stats = useQuestionStats({ question });

  const actions = useQuestionActions({
    question,
    callbacks: {
      onClose: () => navigate('/'),
      onQuestionRefreshed: (updated: Question) => setQuestion(updated),
    },
  });

  const pageContent = (content: React.ReactNode) => (
    <div className='flex min-h-screen flex-col bg-gray-50 pt-[env(safe-area-inset-top)] transition-colors duration-300 dark:bg-gray-900'>
      <Header />
      <main className='mx-auto max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8'>
        {content}
      </main>
      <Footer />
    </div>
  );

  if (isLoading) {
    return pageContent(
      <div className='flex items-center justify-center py-16'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500'></div>
      </div>,
    );
  }

  if (fetchError || !question) {
    return pageContent(
      <div className='py-16 text-center'>
        <div className='mb-4 text-6xl'>😕</div>
        <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
          {fetchError || 'Question not found'}
        </h3>
        <button
          type='button'
          onClick={() => navigate('/')}
          className='mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700'
        >
          Back to Home
        </button>
      </div>,
    );
  }

  return (
    <>
      {pageContent(
        <>
          {/* Back button */}
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='mb-6 flex items-center space-x-2 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
            aria-label='Go back'
          >
            <svg
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18'
              />
            </svg>
            <span className='text-sm font-medium'>Back</span>
          </button>

          {/* Question detail content */}
          <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
            <div className='flex flex-col px-6 pb-6 pt-6'>
              {/* Header */}
              <div className='flex-shrink-0 pb-0'>
                <QuestionHeader
                  question={question}
                  onEdit={actions.handleEdit}
                  onCopy={actions.handleCopyQuestion}
                  onDelete={actions.handleDeleteQuestion}
                />
              </div>

              {/* Content */}
              <div className='py-2'>
                <div className='space-y-6'>
                  <OptionsDisplay options={stats.availableOptions} />

                  <PracticeStats
                    practiceCount={question.count_practise}
                    failureCount={question.count_failure_practise}
                    accuracyRate={stats.accuracyRate}
                  />

                  <AnswerSection
                    isExpanded={isAnswerExpanded}
                    onToggle={() => setIsAnswerExpanded(prev => !prev)}
                    answer={question.answer}
                    explanation={question.notes}
                    question={question}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className='flex-shrink-0 pt-0'>
                <QuestionFooter question={question} />
              </div>
            </div>
          </div>
        </>,
      )}

      {/* Edit Question Modal */}
      <QuestionFormModal
        isOpen={actions.isEditModalOpen}
        onClose={actions.handleCloseEditModal}
        onQuestionSaved={actions.handleQuestionUpdated}
        mode='edit'
        question={question}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={actions.deleteConfirmation.showConfirm}
        title='Delete Question'
        message={actions.deleteConfirmation.confirmMessage}
        confirmText='Delete Question'
        variant='danger'
        isConfirming={actions.deleteConfirmation.isDeleting}
        onConfirm={actions.deleteConfirmation.confirmDelete}
        onCancel={actions.deleteConfirmation.cancelDelete}
      />
    </>
  );
};
