import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiService } from '../../../lib/api';
import { Word, WordDefinition } from '../../../types/api';
import { DetailPageLayout } from '../../../components/layout';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { WordFormModal } from '../word-form';
import { DefinitionFormModal } from '../definition-form';
import { createExactWordSearchFilter } from '../word-form/utils';
import { ExternalDictionaryState } from '../definition-form/hooks/useDictionaryData';
import { CambridgeApiResponse } from '../definition-form/types';

import { useWordActions } from './hooks/useWordActions';
import { useDefinitionActions } from './hooks/useDefinitionActions';
import { WordHeader } from './components/WordHeader';
import { DefinitionsList } from './components/DefinitionsList';
import { WordDeleteConfirmation } from './components/WordDeleteConfirmation';

export const WordDetailPage: React.FC = () => {
  const { wordText } = useParams<{ wordText: string }>();
  const navigate = useNavigate();

  const [word, setWord] = useState<Word | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isDefinitionAddModalOpen, setIsDefinitionAddModalOpen] =
    useState(false);
  const [isDefinitionEditModalOpen, setIsDefinitionEditModalOpen] =
    useState(false);
  const [editingDefinition, setEditingDefinition] =
    useState<WordDefinition | null>(null);

  const [sharedDictionaryData, setSharedDictionaryData] =
    useState<CambridgeApiResponse | null>(null);
  const [sharedIsLoadingDictionary, setSharedIsLoadingDictionary] =
    useState(false);
  const [sharedDictionaryError, setSharedDictionaryError] = useState<
    string | null
  >(null);
  const [sharedIsCollapsed, setSharedIsCollapsed] = useState(true);

  const sharedDictionaryState: ExternalDictionaryState = {
    dictionaryData: sharedDictionaryData,
    isLoadingDictionary: sharedIsLoadingDictionary,
    dictionaryError: sharedDictionaryError,
    isCollapsed: sharedIsCollapsed,
    setDictionaryData: setSharedDictionaryData,
    setIsLoadingDictionary: setSharedIsLoadingDictionary,
    setDictionaryError: setSharedDictionaryError,
    setIsCollapsed: setSharedIsCollapsed,
  };

  const fetchWord = useCallback(async () => {
    if (!wordText) {
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(null);

      const searchFilter = createExactWordSearchFilter(wordText);
      const results = await apiService.searchWords({
        searchFilter,
        limit: 1,
      });

      if (results.length > 0) {
        setWord(results[0]);
      } else {
        setFetchError('Word not found');
      }
    } catch {
      setFetchError('Failed to load word. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [wordText]);

  useEffect(() => {
    fetchWord();
  }, [fetchWord]);

  const [showClearReminderConfirm, setShowClearReminderConfirm] =
    useState(false);

  const handleClearReminder = useCallback(async () => {
    if (!word) {
      return;
    }
    await apiService.updateWordFields(word.id, {
      word: word.word,
      familiarity: word.familiarity,
      reminder: '',
    });
    setShowClearReminderConfirm(false);
    fetchWord();
  }, [word, fetchWord]);

  const handleWordSaved = useCallback(
    (newWordText?: string) => {
      if (newWordText && newWordText !== wordText) {
        navigate(`/word/${encodeURIComponent(newWordText)}`);
      } else {
        fetchWord();
      }
    },
    [wordText, navigate, fetchWord],
  );

  const wordActions = useWordActions({
    word,
    callbacks: { onEdit: () => {}, onDelete: () => {} },
    onClose: () => navigate('/'),
  });

  const definitionActions = useDefinitionActions({
    callbacks: {
      onEdit: (definition: WordDefinition) => {
        setEditingDefinition(definition);
        setIsDefinitionEditModalOpen(true);
      },
      onDelete: () => {},
      onWordUpdated: fetchWord,
    },
  });

  const handleAddDefinition = () => {
    setIsDefinitionAddModalOpen(true);
  };

  const handleCloseDefinitionModal = () => {
    setIsDefinitionAddModalOpen(false);
    setIsDefinitionEditModalOpen(false);
    setEditingDefinition(null);
    setSharedDictionaryData(null);
    setSharedDictionaryError(null);
    setSharedIsCollapsed(true);
  };

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

  if (fetchError || !word) {
    return (
      <DetailPageLayout
        onBack={() => navigate('/')}
        body={
          <div className='flex flex-1 flex-col items-center justify-center'>
            <div className='mb-4 text-6xl'>😕</div>
            <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
              {fetchError || 'Word not found'}
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
          <WordHeader
            word={word}
            onEdit={wordActions.handleEdit}
            onDelete={wordActions.handleDeleteWord}
          />
        }
        body={
          <>
            {word.reminder && (
              <div className='mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/50 dark:bg-amber-900/20'>
                <svg
                  className='mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                    clipRule='evenodd'
                  />
                </svg>
                <p className='min-w-0 flex-1 text-sm text-amber-800 dark:text-amber-300'>
                  {word.reminder}
                </p>
                <button
                  type='button'
                  onClick={() => setShowClearReminderConfirm(true)}
                  className='mt-0.5 shrink-0 text-amber-400 transition-colors hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300'
                  aria-label='Clear reminder'
                >
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth='2'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            )}
            <DefinitionsList
              definitions={word.definitions || []}
              wordText={word.word}
              onEdit={definitionActions.handleEditDefinition}
              onDelete={definitionActions.handleDeleteDefinition}
              onAddNew={handleAddDefinition}
            />
          </>
        }
      />

      {/* Edit Word Modal */}
      <WordFormModal
        isOpen={wordActions.isEditModalOpen}
        onClose={wordActions.handleCloseEditModal}
        onWordSaved={handleWordSaved}
        onOpenWordDetail={undefined}
        mode='edit'
        word={word}
      />

      {/* Delete Word Confirmation Dialog */}
      <WordDeleteConfirmation
        word={word}
        isOpen={wordActions.showDeleteConfirm}
        onConfirm={wordActions.handleDeleteWordConfirm}
        onCancel={wordActions.handleDeleteWordCancel}
      />

      {/* Clear Reminder Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showClearReminderConfirm}
        title='Clear Reminder'
        message='Are you sure you want to clear the reminder for this word?'
        confirmText='Clear'
        cancelText='Cancel'
        onConfirm={handleClearReminder}
        onCancel={() => setShowClearReminderConfirm(false)}
        variant='warning'
      />

      {/* Definition Form Modal for Adding */}
      <DefinitionFormModal
        isOpen={isDefinitionAddModalOpen}
        onClose={handleCloseDefinitionModal}
        onDefinitionAdded={fetchWord}
        wordId={word.id}
        wordText={word.word}
        mode='add'
        definition={null}
        shouldResetDictionaryOnClose={false}
        externalDictionaryState={sharedDictionaryState}
      />

      {/* Definition Form Modal for Editing */}
      <DefinitionFormModal
        isOpen={isDefinitionEditModalOpen}
        onClose={handleCloseDefinitionModal}
        onDefinitionUpdated={fetchWord}
        wordId={word.id}
        wordText={word.word}
        mode='edit'
        definition={editingDefinition}
        shouldResetDictionaryOnClose={false}
        externalDictionaryState={sharedDictionaryState}
      />
    </>
  );
};
