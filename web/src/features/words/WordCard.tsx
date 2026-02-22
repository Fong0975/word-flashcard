import React, { useState } from 'react';
import { Word, WordDefinition } from '../../types/api';
import { WordDetailModal } from './WordDetailModal';
import { DefinitionFormModal } from './DefinitionFormModal';

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

  const getFamiliarityColor = (familiarity: string) => {
    switch (familiarity.toLowerCase()) {
      case 'green':
        return 'bg-green-500 dark:bg-green-400';
      case 'yellow':
        return 'bg-yellow-500 dark:bg-yellow-400';
      case 'red':
        return 'bg-red-500 dark:bg-red-400';
      default:
        return 'bg-gray-400 dark:bg-gray-500';
    }
  };

  return (
    <>
      <div
        className={`
          group cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
          hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600
          transition-all duration-200 ease-in-out
          flex items-center p-4
          ${className}
        `}
        onClick={handleCardClick}
      >
        {/* Left color band for familiarity */}
        <div
          className={`
            w-1 h-12 rounded-full mr-4 flex-shrink-0
            ${getFamiliarityColor(word.familiarity || '')}
          `}
          title={`Familiarity: ${word.familiarity || 'unknown'}`}
        />

        {/* Sequence Number Section */}
        <div className="flex-shrink-0 w-10 mr-3 flex justify-center items-center">
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors tabular-nums">
            {index}
          </span>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
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

        {/* Right chevron icon */}
        <div className="flex-shrink-0 ml-4">
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

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
  );
};