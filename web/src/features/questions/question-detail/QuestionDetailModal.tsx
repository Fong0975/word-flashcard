import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { QuestionFormModal } from '../question-form/QuestionFormModal';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
// import { useModalLayout, ModalLayoutPresets } from '../../../hooks/ui/useModalLayout'; // Using direct layout like WordDetailModal
import { QuestionDetailModalProps } from './types/question-detail';
import { useQuestionDetail } from './hooks/useQuestionDetail';
import {
  QuestionHeader,
  OptionsDisplay,
  PracticeStats,
  AnswerSection,
  QuestionFooter
} from './components';

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question,
  isOpen,
  onClose,
  onQuestionUpdated,
  onQuestionRefreshed,
}) => {
  // Direct layout configuration (same as WordDetailModal for consistent behavior)

  const { isAnswerExpanded, toggleAnswerSection, stats, actions } = useQuestionDetail({
    question,
    onClose,
    onQuestionUpdated,
    onQuestionRefreshed
  });

  if (!question) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="2xl"
        className="max-h-[95vh] overflow-hidden"
      >
        <div className="flex flex-col h-[90vh] -m-6 -mt-4">
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-6 pt-6 pb-0">
            <QuestionHeader
              question={question}
              onEdit={actions.handleEdit}
              onCopy={actions.handleCopyQuestion}
              onDelete={actions.handleDeleteQuestion}
            />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
            <div className="space-y-6">
              <OptionsDisplay options={stats.availableOptions} />

              <PracticeStats
                practiceCount={question.count_practise}
                failureCount={question.count_failure_practise}
                accuracyRate={stats.accuracyRate}
              />

              <AnswerSection
                isExpanded={isAnswerExpanded}
                onToggle={toggleAnswerSection}
                answer={question.answer}
                explanation={question.notes}
                question={question}
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 px-6 pt-0 pb-6">
            <QuestionFooter question={question} />
          </div>
        </div>
      </Modal>

      {/* Edit Question Modal */}
      <QuestionFormModal
        isOpen={actions.isEditModalOpen}
        onClose={actions.handleCloseEditModal}
        onQuestionSaved={actions.handleQuestionUpdated}
        mode="edit"
        question={question}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={actions.deleteConfirmation.showConfirm}
        title="Delete Question"
        message={actions.deleteConfirmation.confirmMessage}
        confirmText="Delete Question"
        variant="danger"
        isConfirming={actions.deleteConfirmation.isDeleting}
        onConfirm={actions.deleteConfirmation.confirmDelete}
        onCancel={actions.deleteConfirmation.cancelDelete}
      />
    </>
  );
};