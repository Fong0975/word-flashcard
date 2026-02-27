import React from 'react';

import { Modal } from '../../../components/ui/Modal';
import { CopyButton } from '../../../components/ui/CopyButton';
import { Question } from '../../../types/api';
import { formatFormDataForCopy } from '../question-detail/utils/questionFormat';

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
  const copyText = formatFormDataForCopy(formData);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth='2xl'
      disableBackdropClose={true}
      className='max-h-[95vh] overflow-hidden'
    >
      <div className='-m-6 -mt-4 flex h-[90vh] flex-col'>
        {/* Fixed Header */}
        <div className='mb-2 flex-shrink-0 px-6 pb-0 pt-4'>
          <div className='border-b border-gray-200 px-2 pb-4 pt-2 dark:border-gray-700'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              {modalTitle}
            </h2>
            <div className='mt-3 flex justify-end'>
              <CopyButton
                text={copyText}
                title='Copy current form content to clipboard'
                successText='Form content copied!'
              />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className='min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4'>
          <form onSubmit={handleFormSubmit}>
            <div className='space-y-6'>
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
        <div className='flex-shrink-0 px-6 pb-4 pt-0'>
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
