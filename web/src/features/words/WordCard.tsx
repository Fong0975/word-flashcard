import React, { useState } from 'react';
import { Word, WordDefinition } from '../../types/api';
import { EntityCard } from '../shared/components/EntityCard';
import { getFamiliarityColor } from '../shared/constants/familiarity';
import { WordDetailModal } from './word-detail/WordDetailModal';
import { DefinitionFormModal } from './definition-form';

interface WordCardProps {
  index: number;
  word: Word;
  className?: string;
  onWordUpdated?: () => void;
}

export const WordCard: React.FC<WordCardProps> = ({ index, word, className = '', onWordUpdated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDefinitionModalOpen, setIsDefinitionModalOpen] = useState(false);
  const [isEditDefinitionModalOpen, setIsEditDefinitionModalOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<WordDefinition | null>(null);

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
      renderContent={(word) => (
        <div>
          {/* Word */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">
            {word.word}
          </h3>

          {/* Definition count hint */}
          {word.definitions && word.definitions.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {word.definitions.length} definition{word.definitions.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
      getLeftIndicatorColor={(word) => getFamiliarityColor(word.familiarity || '')}
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
          />

          {/* Modal for editing definition */}
          <DefinitionFormModal
            isOpen={isEditDefinitionModalOpen}
            onClose={handleCloseEditDefinitionModal}
            onDefinitionUpdated={handleWordUpdated}
            wordId={word.id}
            wordText={word.word}
            mode="edit"
            definition={editingDefinition}
          />
        </>
      }
      className={className}
    />
  );
};