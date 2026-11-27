import React from 'react';

import { SectionedModal } from '../../../components/ui/SectionedModal';
import { CopyButton } from '../../../components/ui/CopyButton';
import { FormActions } from '../../../components/ui/FormActions';
import { FormErrorMessage } from '../../../components/ui/FormErrorMessage';
import { UnsavedChangesDialog } from '../../../components/ui/UnsavedChangesDialog';
import { useTemplateButtons } from '../../../hooks/shared';
import { useUnsavedChangesGuard } from '../../../hooks/ui/useUnsavedChangesGuard';
import { Question } from '../../../types/api';
import { ReminderFormField } from '../../shared/components/ReminderFormField';
import { formatFormDataForCopy } from '../question-detail/utils/questionFormat';

import { useQuestionForm } from './hooks/useQuestionForm';
import { useQuestionSubmit } from './hooks/useQuestionSubmit';
import {
  QuestionInput,
  OptionsGroup,
  ReferenceInput,
  NotesInput,
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
    isDirty,
    reminderState,
    effectiveReminder,
    handlers: {
      handleQuestionChange,
      handleAnswerChange,
      handleOptionChange,
      handleNotesChange,
      handleReferenceChange,
      setReferenceFromTemplate,
      handleReminderEnabledChange,
      handleReminderTextChange,
    },
    resetForm,
  } = useQuestionForm({ mode, question, isOpen });

  const { isSubmitting, error, handleSubmit } = useQuestionSubmit({
    mode,
    question,
    callbacks,
    resetForm,
  });

  const { templateButtonsConfig: referenceTemplateButtons } =
    useTemplateButtons({
      configFileName: 'questionFormModalReferenceButtonsConfig.json',
    });

  const { templateButtonsConfig: notesTemplateButtons } = useTemplateButtons({
    configFileName: 'questionFormModalNotesButtonsConfig.json',
  });

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const unsavedChangesGuard = useUnsavedChangesGuard({
    isEditing: isOpen,
    isDirty: isOpen && isDirty,
    onLeave: handleClose,
  });

  const modalTitle = mode === 'create' ? 'Add New Question' : 'Edit Question';
  const copyText = formatFormDataForCopy(formData);

  return (
    <SectionedModal
      isOpen={isOpen}
      onClose={unsavedChangesGuard.requestLeave}
      maxWidth='2xl'
      disableBackdropClose={true}
      header={
        <div className='border-b border-gray-200 px-2 pt-2 pb-4 dark:border-gray-700'>
          <div className='flex items-center'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              {modalTitle}
            </h2>
            <CopyButton
              text={copyText}
              title='Copy current form content to clipboard'
              successText='Form content copied!'
              className='ml-2'
            />
          </div>
        </div>
      }
      footer={
        <FormActions
          mode={mode}
          entityLabel='Question'
          isSubmitting={isSubmitting}
          isFormValid={isValid}
          onCancel={handleClose}
          onSubmit={() =>
            handleSubmit({ ...formData, reminder: effectiveReminder })
          }
          className='flex justify-end space-x-3 pt-4 pb-2'
        />
      }
      overlays={
        <UnsavedChangesDialog
          isOpen={unsavedChangesGuard.showConfirm}
          onConfirm={unsavedChangesGuard.confirmLeave}
          onCancel={unsavedChangesGuard.cancelLeave}
        />
      }
    >
      <div>
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
            answer={formData.answer}
            onAnswerChange={handleAnswerChange}
            disabled={isSubmitting}
          />

          <ReferenceInput
            value={formData.reference}
            onChange={handleReferenceChange}
            disabled={isSubmitting}
            templateButtons={referenceTemplateButtons}
            onSelectTemplate={setReferenceFromTemplate}
          />

          <NotesInput
            value={formData.notes}
            onChange={handleNotesChange}
            disabled={isSubmitting}
            templateButtons={notesTemplateButtons}
          />

          {mode === 'edit' && (
            <ReminderFormField
              description='Have a note to remember? Set a reminder for this question.'
              enabled={reminderState.reminderEnabled}
              text={reminderState.reminderText}
              onEnabledChange={handleReminderEnabledChange}
              onTextChange={handleReminderTextChange}
              disabled={isSubmitting}
            />
          )}

          <FormErrorMessage error={error} />
        </div>
      </div>
    </SectionedModal>
  );
};
