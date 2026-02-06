import React, { useState } from 'react';
import { Word, WordDefinition } from '../../types/api';
import { Modal } from '../../components/ui/Modal';
import { PronunciationButton } from '../../components/ui/PronunciationButton';
import { WordFormModal } from './WordFormModal';
import { extractPronunciationUrls, isValidAudioUrl } from '../shared/phonetics';
import { apiService } from '../../lib/api';

interface WordDetailModalProps {
  word: Word | null;
  isOpen: boolean;
  onClose: () => void;
  onWordUpdated?: () => void;
  onOpenDefinitionModal?: () => void;
  onOpenEditDefinitionModal?: (definition: WordDefinition) => void;
}

interface DefinitionViewProps {
  definition: WordDefinition;
  index: number;
  onEdit: (definition: WordDefinition) => void;
  onDelete: (definition: WordDefinition) => void;
}

const DefinitionView: React.FC<DefinitionViewProps> = ({ definition, index, onEdit, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pronunciationUrls = extractPronunciationUrls(definition.phonetics);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(definition);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {definition.part_of_speech &&
            definition.part_of_speech
              .split(',')
              .filter(pos => pos.trim())
              .map((pos, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {pos.trim()}
                </span>
              ))
          }
        </div>

        {/* Pronunciation buttons */}
        {(pronunciationUrls.uk || pronunciationUrls.us) && (
          <div className="flex items-center space-x-2">
            {pronunciationUrls.uk && isValidAudioUrl(pronunciationUrls.uk) && (
              <PronunciationButton
                audioUrl={pronunciationUrls.uk}
                accent="uk"
                size="sm"
              />
            )}
            {pronunciationUrls.us && isValidAudioUrl(pronunciationUrls.us) && (
              <PronunciationButton
                audioUrl={pronunciationUrls.us}
                accent="us"
                size="sm"
              />
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
          {definition.definition}
        </p>

        {definition.examples && definition.examples.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Examples:
            </h5>
            <ul className="space-y-1">
              {definition.examples.map((example, exampleIndex) => (
                <li key={exampleIndex} className="text-sm text-gray-600 dark:text-gray-400 italic pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        {definition.notes && (
          <div>
            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Notes:
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
              {definition.notes}
            </p>
          </div>
        )}

        {/* Phonetics are now displayed as interactive pronunciation buttons above */}
      </div>

      {/* Action buttons row */}
      <div className="flex justify-end items-center space-x-2 pt-3 border-t border-gray-200 dark:border-gray-600">
        <button
          type="button"
          onClick={() => onEdit(definition)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          title="Edit definition"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          title="Delete definition"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete Definition
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this definition? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  isOpen,
  onClose,
  onWordUpdated,
  onOpenDefinitionModal,
  onOpenEditDefinitionModal,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteWordConfirm, setShowDeleteWordConfirm] = useState(false);

  if (!word) return null;

  // Handle edit action
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  // Handle closing edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  // Handle word updated successfully
  const handleWordUpdated = () => {
    // Notify parent to refresh data
    if (onWordUpdated) {
      onWordUpdated();
    }
  };

  const handleNew = () => {
    if (onOpenDefinitionModal) {
      onOpenDefinitionModal();
    }
  };

  // Handle edit definition action
  const handleEditDefinition = (definition: WordDefinition) => {
    if (onOpenEditDefinitionModal) {
      onOpenEditDefinitionModal(definition);
    }
  };

  // Handle delete definition action
  const handleDeleteDefinition = async (definition: WordDefinition) => {
    try {
      await apiService.deleteDefinition(definition.id);
      // Notify parent to refresh data
      if (onWordUpdated) {
        onWordUpdated();
      }
    } catch (error) {
      console.error('Failed to delete definition:', error);
      // You could add error handling UI here
    }
  };

  // Handle delete word action
  const handleDeleteWord = () => {
    setShowDeleteWordConfirm(true);
  };

  const handleDeleteWordConfirm = async () => {
    if (!word) return;

    try {
      await apiService.deleteWord(word.id);
      // Close modal first
      onClose();
      // Notify parent to refresh data
      if (onWordUpdated) {
        onWordUpdated();
      }
    } catch (error) {
      console.error('Failed to delete word:', error);
      // You could add error handling UI here
    } finally {
      setShowDeleteWordConfirm(false);
    }
  };

  const handleDeleteWordCancel = () => {
    setShowDeleteWordConfirm(false);
  };



  const getFamiliarityBarColor = (familiarity: string) => {
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
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="2xl"
        className="max-h-[90vh] overflow-hidden flex flex-col"
      >
      <div className="overflow-y-auto">
        {/* Header */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {word.word}
            </h1>
          </div>

          {/* Familiarity Bar */}
          {word.familiarity && (
            <div className="text-center mb-4">
              <div className={`w-24 h-2 rounded-full transition-colors duration-300 mx-auto ${getFamiliarityBarColor(word.familiarity)}`} />
            </div>
          )}

          {/* Edit and Delete Word Buttons */}
          <div className="flex justify-end me-2 space-x-2">
            <button
              type="button"
              onClick={handleEdit}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              title="Edit word"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDeleteWord}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="Delete word"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Definitions */}
        <div className="space-y-4">
          {word.definitions && word.definitions.length > 0 ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Definitions ({word.definitions.length})
              </h2>

              {/* Add Definition Button */}
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={handleNew}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="Add new definition"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>

              {word.definitions.map((definition, index) => (
                <DefinitionView
                  key={definition.id}
                  definition={definition}
                  index={index}
                  onEdit={handleEditDefinition}
                  onDelete={handleDeleteDefinition}
                />
              ))}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Definitions (0)
              </h2>

              {/* Add Definition Button for empty state */}
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={handleNew}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="Add new definition"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>

              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600 dark:text-gray-300">
                  No definitions available for this word yet.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer with word ID for reference */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Word ID: {word.id}</span>
            <span>{word.definitions?.length || 0} definition(s)</span>
          </div>
        </div>
      </div>

      {/* Edit Word Modal */}
      <WordFormModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onWordSaved={handleWordUpdated}
        mode="edit"
        word={word}
      />
    </Modal>

    {/* Delete Word Confirmation Dialog */}
    {showDeleteWordConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete Word
              </h3>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the word "{word?.word}"? This will delete the word and all its definitions. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleDeleteWordCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteWordConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Delete Word
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};