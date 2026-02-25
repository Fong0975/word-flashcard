import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { QuestionFormModal } from '../question-form/QuestionFormModal';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { useModalLayout, ModalLayoutPresets } from '../../../hooks/ui/useModalLayout';
import { QuestionDetailModalProps } from './types/question-detail';
import { useQuestionDetail } from './hooks/useQuestionDetail';
import {
  QuestionHeader,
  OptionsDisplay,
  PracticeStats,
  ReferenceSection,
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
  // Use layout preset for detail modal
  const layout = useModalLayout(ModalLayoutPresets.detail);

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
        <div className={layout.container}>
          {/* Fixed Header */}
          <div className={layout.header}>
            <QuestionHeader
              question={question}
              onEdit={actions.handleEdit}
              onCopy={actions.handleCopyQuestion}
              onDelete={actions.handleDeleteQuestion}
            />
          </div>

          {/* Scrollable Content */}
          <div className={layout.content}>
            <div className="space-y-6">
              <OptionsDisplay options={stats.availableOptions} />

              <PracticeStats
                practiceCount={question.count_practise}
                failureCount={question.count_failure_practise}
                accuracyRate={stats.accuracyRate}
              />

              <ReferenceSection reference={question.reference} />

              <AnswerSection
                isExpanded={isAnswerExpanded}
                onToggle={toggleAnswerSection}
                answer={question.answer}
                explanation={question.notes}
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <div className={layout.footer}>
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