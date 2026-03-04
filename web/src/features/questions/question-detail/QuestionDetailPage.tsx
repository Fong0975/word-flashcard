import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiService } from '../../../lib/api';
import { Question } from '../../../types/api';
import { DetailPageLayout } from '../../../components/layout';
import { QuestionFormModal } from '../question-form/QuestionFormModal';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';

import { useQuestionActions } from './hooks/useQuestionActions';
import { useQuestionStats } from './hooks/useQuestionStats';
import {
  QuestionHeader,
  OptionsDisplay,
  PracticeStats,
  AnswerSection,
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

  if (isLoading) {
    return (
      <DetailPageLayout
        onBack={() => navigate(-1)}
        body={
          <div className='flex flex-1 items-center justify-center'>
            <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500'></div>
          </div>
        }
      />
    );
  }

  if (fetchError || !question) {
    return (
      <DetailPageLayout
        onBack={() => navigate('/')}
        body={
          <div className='flex flex-1 flex-col items-center justify-center'>
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
          </div>
        }
      />
    );
  }

  return (
    <>
      <DetailPageLayout
        onBack={() => navigate(-1)}
        header={
          <QuestionHeader
            question={question}
            onEdit={actions.handleEdit}
            onCopy={actions.handleCopyQuestion}
            onDelete={actions.handleDeleteQuestion}
          />
        }
        body={
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
        }
      />

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
