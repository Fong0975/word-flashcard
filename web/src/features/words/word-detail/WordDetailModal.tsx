import React from 'react';

import { Modal } from '../../../components/ui/Modal';
import { WordFormModal } from '../word-form';

import { WordDetailModalProps } from './types/word-detail';
import { useWordDetail } from './hooks/useWordDetail';
import {
  WordHeader,
  DefinitionsList,
  WordFooter,
  WordDeleteConfirmation,
} from './components';

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  isOpen,
  onClose,
  onWordUpdated,
  onOpenDefinitionModal,
  onOpenEditDefinitionModal,
}) => {
  const { wordActions, definitionActions } = useWordDetail({
    word,
    onClose,
    onWordUpdated,
    onOpenDefinitionModal,
    onOpenEditDefinitionModal,
  });

  if (!word) {
    return null;
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth='2xl'
        className='max-h-[95vh] overflow-hidden'
      >
        <div className='-m-6 -mt-4 flex h-[90vh] flex-col'>
          {/* Fixed Header */}
          <div className='flex-shrink-0 px-6 pb-0 pt-6'>
            <WordHeader
              word={word}
              onEdit={wordActions.handleEdit}
              onDelete={wordActions.handleDeleteWord}
            />
          </div>

          {/* Scrollable Content */}
          <div className='min-h-0 flex-1 overflow-y-auto px-6 py-2'>
            <DefinitionsList
              definitions={word.definitions || []}
              onEdit={definitionActions.handleEditDefinition}
              onDelete={definitionActions.handleDeleteDefinition}
              onAddNew={definitionActions.handleNew}
            />
          </div>

          {/* Fixed Footer */}
          <div className='flex-shrink-0 px-6 pb-6 pt-0'>
            <WordFooter word={word} />
          </div>
        </div>
      </Modal>

      {/* Edit Word Modal */}
      <WordFormModal
        isOpen={wordActions.isEditModalOpen}
        onClose={wordActions.handleCloseEditModal}
        onWordSaved={wordActions.handleWordUpdated}
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
    </>
  );
};
