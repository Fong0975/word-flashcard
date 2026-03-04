import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiService } from '../../../lib/api';
import { Word, WordDefinition } from '../../../types/api';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { WordFormModal } from '../word-form';
import { DefinitionFormModal } from '../definition-form';
import { createExactWordSearchFilter } from '../word-form/utils';
import { ExternalDictionaryState } from '../definition-form/hooks/useDictionaryData';
import { CambridgeApiResponse } from '../definition-form/types';

import { useWordActions } from './hooks/useWordActions';
import { useDefinitionActions } from './hooks/useDefinitionActions';
import { WordHeader } from './components/WordHeader';
import { DefinitionsList } from './components/DefinitionsList';
import { WordFooter } from './components/WordFooter';
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

  if (fetchError || !word) {
    return pageContent(
      <div className='py-16 text-center'>
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

          {/* Word detail content */}
          <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
            <div className='flex flex-col px-6 pb-6 pt-6'>
              {/* Header */}
              <div className='flex-shrink-0 pb-0'>
                <WordHeader
                  word={word}
                  onEdit={wordActions.handleEdit}
                  onDelete={wordActions.handleDeleteWord}
                />
              </div>

              {/* Definitions */}
              <div className='py-2'>
                <DefinitionsList
                  definitions={word.definitions || []}
                  onEdit={definitionActions.handleEditDefinition}
                  onDelete={definitionActions.handleDeleteDefinition}
                  onAddNew={handleAddDefinition}
                />
              </div>

              {/* Footer */}
              <div className='flex-shrink-0 pt-0'>
                <WordFooter word={word} />
              </div>
            </div>
          </div>
        </>,
      )}

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
