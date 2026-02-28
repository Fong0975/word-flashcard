import React, { useState } from 'react';

import { Word, WordDefinition } from '../../types/api';
import { EntityCard } from '../shared/components/EntityCard';
import { getFamiliarityColor } from '../shared/constants/familiarity';

import { ExternalDictionaryState } from './definition-form/hooks/useDictionaryData';
import { CambridgeApiResponse } from './definition-form/types';
import { WordDetailModal } from './word-detail/WordDetailModal';
import { DefinitionFormModal } from './definition-form';

interface WordCardProps {
  index: number;
  word: Word;
  className?: string;
  onWordUpdated?: () => void;
}

export const WordCard: React.FC<WordCardProps> = ({
  index,
  word,
  className = '',
  onWordUpdated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDefinitionModalOpen, setIsDefinitionModalOpen] = useState(false);
  const [isEditDefinitionModalOpen, setIsEditDefinitionModalOpen] =
    useState(false);
  const [editingDefinition, setEditingDefinition] =
    useState<WordDefinition | null>(null);

  // Shared dictionary state for both DefinitionFormModals
  const [sharedDictionaryData, setSharedDictionaryData] =
    useState<CambridgeApiResponse | null>(null);
  const [sharedIsLoadingDictionary, setSharedIsLoadingDictionary] =
    useState(false);
  const [sharedDictionaryError, setSharedDictionaryError] = useState<
    string | null
  >(null);
  const [sharedIsCollapsed, setSharedIsCollapsed] = useState(true);

  // Create shared dictionary state object
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

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);

    // Reset shared dictionary data when WordDetailModal closes
    setSharedDictionaryData(null);
    setSharedDictionaryError(null);
    setSharedIsCollapsed(true);
  };

  const handleOpenDefinitionModal = () => {
    setIsDefinitionModalOpen(true);
  };

  const handleCloseDefinitionModal = () => {
    setIsDefinitionModalOpen(false);
  };

  const handleWordUpdated = () => {
    if (onWordUpdated) {
      onWordUpdated();
    }
  };

  const handleOpenEditDefinitionModal = (definition: WordDefinition) => {
    setEditingDefinition(definition);
    setIsEditDefinitionModalOpen(true);
  };

  const handleCloseEditDefinitionModal = () => {
    setIsEditDefinitionModalOpen(false);
    setEditingDefinition(null);
  };

  return (
    <EntityCard
      index={index}
      entity={word}
      config={{
        showSequence: true,
        sequenceStyle: 'simple',
        showLeftIndicator: true,
        leftIndicatorType: 'color-band',
      }}
      actions={{
        onClick: handleCardClick,
        onEntityUpdated: onWordUpdated,
      }}
      renderContent={word => (
        <div>
          {/* Word */}
          <h3 className='mb-1 truncate text-lg font-semibold text-gray-900 dark:text-white'>
            {word.word}
          </h3>

          {/* Definition count hint */}
          {word.definitions && word.definitions.length > 0 && (
            <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
              {word.definitions.length} definition
              {word.definitions.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
      getLeftIndicatorColor={word =>
        getFamiliarityColor(word.familiarity || '')
      }
      additionalModals={
        <>
          {/* Modal for word details */}
          <WordDetailModal
            word={word}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onWordUpdated={handleWordUpdated}
            onOpenDefinitionModal={handleOpenDefinitionModal}
            onOpenEditDefinitionModal={handleOpenEditDefinitionModal}
          />

          {/* Modal for adding new definition */}
          <DefinitionFormModal
            isOpen={isDefinitionModalOpen}
            onClose={handleCloseDefinitionModal}
            onDefinitionAdded={handleWordUpdated}
            wordId={word.id}
            wordText={word.word}
            shouldResetDictionaryOnClose={false}
            externalDictionaryState={sharedDictionaryState}
          />

          {/* Modal for editing definition */}
          <DefinitionFormModal
            isOpen={isEditDefinitionModalOpen}
            onClose={handleCloseEditDefinitionModal}
            onDefinitionUpdated={handleWordUpdated}
            wordId={word.id}
            wordText={word.word}
            mode='edit'
            definition={editingDefinition}
            shouldResetDictionaryOnClose={false}
            externalDictionaryState={sharedDictionaryState}
          />
        </>
      }
      className={className}
    />
  );
};
