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
  FormActions,
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
    onQuestionSaved,
  };

  const {
    formData,
    isValid,
    handlers: {
      handleQuestionChange,
      handleAnswerChange,
      handleOptionChange,
      handleNotesChange,
      handleReferenceChange,
    },
    resetForm,
  } = useQuestionForm({ mode, question, isOpen });

  const { isSubmitting, error, handleSubmit } = useQuestionSubmit({
    mode,
    question,
    callbacks,
    resetForm,
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
      maxWidth="2xl"
      disableBackdropClose={true}
      className="max-h-[95vh] overflow-hidden"
    >
      <div className="flex flex-col h-[90vh] -m-6 -mt-4">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-6 pt-4 pb-0 mb-2">
          <div className="px-2 pt-2 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {modalTitle}
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">
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
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 px-6 pt-0 pb-4">
          <FormActions
            mode={mode}
            isSubmitting={isSubmitting}
            isFormValid={isValid}
            onCancel={handleClose}
            onSubmit={() => handleSubmit(formData)}
          />
        </div>
      </div>
    </Modal>
  );
};