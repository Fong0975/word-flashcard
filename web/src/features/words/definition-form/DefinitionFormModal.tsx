import React, { useEffect } from 'react';

import { Modal, ToastContainer } from '../../../components/ui';
import { useToast } from '../../../hooks/ui/useToast';
import { useCopyToClipboard } from '../../../hooks/ui/useCopyToClipboard';

import { DictionaryLookup, FormFields } from './components';
import { useDefinitionForm, useDictionaryData, useNoteButtons } from './hooks';
import { DefinitionFormModalProps } from './types';
import { CambridgeDefinition } from './types/cambridge';

export const DefinitionFormModal: React.FC<DefinitionFormModalProps> = ({
  isOpen,
  onClose,
  onDefinitionAdded,
  onDefinitionUpdated,
  wordId,
  wordText,
  mode = 'add' as const,
  definition = null,
}) => {
  // Hooks
  const { toasts, showSuccess, showError, showWarning, removeToast } =
    useToast();
  const formLogic = useDefinitionForm({
    isOpen,
    mode,
    wordId,
    definition,
    onDefinitionAdded,
    onDefinitionUpdated,
    onClose,
    onError: showError,
  });

  const dictionaryLogic = useDictionaryData(wordText, showSuccess, showError);
  const { copySuccess, copyToClipboard } = useCopyToClipboard({
    onError: (error, message) => showError(message),
  });
  const { noteButtonsConfig } = useNoteButtons({
    onWarning: showWarning,
  });

  // Reset dictionary data when modal closes
  useEffect(() => {
    if (!isOpen) {
      dictionaryLogic.resetDictionaryData();
    }
  }, [isOpen, dictionaryLogic]);

  // Enhanced dictionary handlers that update form data
  const handleApplyPronunciation = (
    ukUrl: string,
    usUrl: string,
    pos?: string,
  ) => {
    dictionaryLogic.applyPronunciation(
      ukUrl,
      usUrl,
      pos,
      formLogic.updateFormData,
    );
  };

  const handleApplyDefinition = (definition: CambridgeDefinition) => {
    dictionaryLogic.applyDefinition(definition, formLogic.updateFormData);
  };

  const handleCopyWord = () => {
    if (wordText) {
      copyToClipboard(wordText);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth='xl'
      className='max-h-[95vh] overflow-hidden'
      disableBackdropClose={true}
    >
      <div className='-m-6 -mt-4 flex h-[90vh] flex-col'>
        {/* Fixed Header */}
        <div className='mb-2 flex-shrink-0 px-6 pb-0 pt-4'>
          <div className='border-b border-gray-200 pb-2 dark:border-gray-700'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              {mode === 'edit' ? 'Edit Definition' : 'Add New Definition'}
            </h2>
            {wordText && (
              <div className='mt-1 flex items-center'>
                <p className='text-lg text-gray-600 dark:text-gray-400'>
                  for "
                  <a
                    className='font-semibold text-gray-800 dark:text-blue-500 hover:dark:text-blue-300'
                    href={`https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/${wordText}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {wordText}
                  </a>
                  "
                </p>
                <button
                  type='button'
                  onClick={handleCopyWord}
                  className='ml-2 rounded-md p-1 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-200'
                  title='Copy word text to clipboard'
                >
                  {copySuccess ? (
                    <svg
                      className='h-5 w-5 text-green-500'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='2'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  ) : (
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
                        d='M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184'
                      />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className='min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4'>
          {/* Cambridge Dictionary Section */}
          <DictionaryLookup
            wordText={wordText}
            dictionaryData={dictionaryLogic.dictionaryData}
            isLoadingDictionary={dictionaryLogic.isLoadingDictionary}
            dictionaryError={dictionaryLogic.dictionaryError}
            isCollapsed={dictionaryLogic.isCollapsed}
            onFetchDictionary={dictionaryLogic.fetchDictionaryData}
            onToggleCollapsed={dictionaryLogic.toggleCollapsed}
            onApplyPronunciation={handleApplyPronunciation}
            onApplyDefinition={handleApplyDefinition}
            groupPronunciationsByPos={dictionaryLogic.groupPronunciationsByPos}
          />

          {/* Form Fields Section */}
          <FormFields
            formData={formLogic.formData}
            isFormValid={formLogic.isFormValid}
            partOfSpeechOptions={formLogic.constants.PART_OF_SPEECH_OPTIONS}
            noteButtonsConfig={noteButtonsConfig}
            handlers={formLogic.handlers}
          />
        </div>

        {/* Fixed Footer */}
        <div className='flex-shrink-0 px-6 pb-4 pt-0'>
          <div className='mb-2 flex justify-end space-x-3 border-t border-gray-200 pt-3 dark:border-gray-700'>
            <button
              type='button'
              onClick={onClose}
              disabled={formLogic.isSubmitting}
              className='rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={formLogic.handlers.handleSubmit}
              disabled={formLogic.isSubmitting || !formLogic.isFormValid}
              className='rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {formLogic.isSubmitting ? (
                <>
                  <svg
                    className='-ml-1 mr-2 inline h-4 w-4 animate-spin text-white'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  {mode === 'edit'
                    ? 'Updating Definition...'
                    : 'Adding Definition...'}
                </>
              ) : mode === 'edit' ? (
                'Update Definition'
              ) : (
                'Add Definition'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </Modal>
  );
};
