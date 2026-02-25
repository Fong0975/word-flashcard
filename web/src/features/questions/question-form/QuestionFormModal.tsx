import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Question } from '../../../types/api';
import { useQuestionForm } from './hooks/useQuestionForm';
import { useQuestionSubmit } from './hooks/useQuestionSubmit';
import {
  QuestionInput,
  OptionsGroup,
  AnswerSelector,
  ReferenceInput,
  NotesInput,
  ErrorMessage,
  FormActions
} from './components';
import { QuestionFormSubmitCallbacks } from './types/question-form';

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionSaved?: (question?: Question) => void;
  mode: 'create' | 'edit';
  question?: Question;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  onQuestionSaved,
  mode,
  question,
}) => {
  const callbacks: QuestionFormSubmitCallbacks = {
    onClose,
    onQuestionSaved
  };

  const {
    formData,
    isValid,
    validationError,
    handlers: {
      handleQuestionChange,
      handleAnswerChange,
      handleOptionChange,
      handleNotesChange,
      handleReferenceChange
    },
    resetForm
  } = useQuestionForm({ mode, question, isOpen });

  const { isSubmitting, error, handleSubmit } = useQuestionSubmit({
    mode,
    question,
    callbacks,
    resetForm
  });

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const modalTitle = mode === 'create' ? 'Add New Question' : 'Edit Question';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth="2xl"
      disableBackdropClose={true}
    >
      <form onSubmit={handleFormSubmit}>
        <div className="space-y-6">
          <QuestionInput
            value={formData.question}
            onChange={handleQuestionChange}
            disabled={isSubmitting}
            autoFocus
          />

          <OptionsGroup
            options={formData.options}
            onChange={handleOptionChange}
            disabled={isSubmitting}
          />

          <AnswerSelector
            value={formData.answer}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />

          <ReferenceInput
            value={formData.reference}
            onChange={handleReferenceChange}
            disabled={isSubmitting}
          />

          <NotesInput
            value={formData.notes}
            onChange={handleNotesChange}
            disabled={isSubmitting}
          />

          <ErrorMessage error={error} />

          <FormActions
            mode={mode}
            isSubmitting={isSubmitting}
            isFormValid={isValid}
            onCancel={handleClose}
            onSubmit={() => handleSubmit(formData)}
          />
        </div>
      </form>
    </Modal>
  );
};