import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Note } from '../../types/api';
import { apiService } from '../../lib/api';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useNotes } from '../../hooks/useNotes';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ToastContainer } from '../../components/ui';
import { useToast } from '../../hooks/ui/useToast';
import { ReviewTabActionButtons } from '../shared/components/ReviewTabActionButtons';
import { TotalCountLabel } from '../shared/components/TotalCountLabel';
import { useRefreshAction } from '../shared/hooks/useRefreshAction';

import { NoteCard } from './NoteCard';

const ITEMS_PER_PAGE = 30;

export const NotesTab: React.FC = () => {
  const navigate = useNavigate();
  const notesHook = useNotes({ itemsPerPage: ITEMS_PER_PAGE });
  const { toasts, showError, removeToast } = useToast();
  const {
    isRefreshing,
    handleRefresh,
    toasts: refreshToasts,
    removeToast: removeRefreshToast,
  } = useRefreshAction(notesHook.refresh);

  const [orderedNotes, setOrderedNotes] = useState<Note[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    setOrderedNotes(notesHook.notes);
  }, [notesHook.notes]);

  const isSearching = !!notesHook.searchTerm;

  const applyNewOrder = useCallback(
    async (newOrder: Note[]) => {
      setOrderedNotes(newOrder);
      setIsReordering(true);

      try {
        const pageOffset = (notesHook.currentPage - 1) * ITEMS_PER_PAGE;
        const updates = newOrder
          .map((note, index) => ({
            id: note.id,
            newSortOrder: pageOffset + index + 1,
            oldSortOrder: note.sort_order,
          }))
          .filter(u => u.newSortOrder !== u.oldSortOrder);

        await Promise.all(
          updates.map(u =>
            apiService.updateNote(u.id, { sort_order: u.newSortOrder }),
          ),
        );
      } catch (error) {
        setOrderedNotes(notesHook.notes);
        showError(
          getApiErrorMessage(error, 'Failed to save the new note order.'),
        );
      } finally {
        setIsReordering(false);
      }
    },
    [notesHook.currentPage, notesHook.notes, showError],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) {
        return;
      }
      const newOrder = [...orderedNotes];
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1],
      ];
      applyNewOrder(newOrder);
    },
    [orderedNotes, applyNewOrder],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= orderedNotes.length - 1) {
        return;
      }
      const newOrder = [...orderedNotes];
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
      applyNewOrder(newOrder);
    },
    [orderedNotes, applyNewOrder],
  );

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== index) {
        setDragOverIndex(index);
      }
    },
    [dragIndex],
  );

  const handleDrop = useCallback(
    (index: number) => {
      if (dragIndex === null || dragIndex === index) {
        return;
      }

      const newOrder = [...orderedNotes];
      const [dragged] = newOrder.splice(dragIndex, 1);
      newOrder.splice(index, 0, dragged);

      setDragIndex(null);
      setDragOverIndex(null);
      applyNewOrder(newOrder);
    },
    [dragIndex, orderedNotes, applyNewOrder],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  if (notesHook.loading && orderedNotes.length === 0 && !isSearching) {
    return (
      <div className='flex justify-center py-12'>
        <div
          role='status'
          aria-label='Loading'
          className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500'
        ></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          Note Review
        </h2>
        <p className='mt-1 text-gray-600 dark:text-gray-300'>
          Manage and review your notes
        </p>

        <ReviewTabActionButtons
          showQuiz={false}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onNew={() => navigate('/note/new')}
        />
      </div>

      {/* Search input */}
      <div className='mb-4'>
        <div className='relative'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            <svg
              className='text-subtle h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
          <input
            type='text'
            value={notesHook.searchTerm}
            onChange={e => notesHook.setSearchTerm(e.target.value)}
            className='glass-panel block w-full rounded-md py-2 pl-10 pr-8 text-sm leading-5 text-gray-900 placeholder-gray-500 focus:border-primary-400/70 focus:outline-none focus:ring-2 focus:ring-primary-400/30 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400/50 dark:focus:ring-primary-400/20'
            placeholder='Search notes...'
          />
          {notesHook.searchTerm && (
            <button
              type='button'
              onClick={() => notesHook.setSearchTerm('')}
              className='focus-ring text-supporting absolute inset-y-0 right-0 flex items-center rounded-md pr-3 hover:text-gray-900 focus-visible:text-gray-900 dark:hover:text-gray-200 dark:focus-visible:text-gray-200'
              aria-label='Clear search'
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
          )}
        </div>
      </div>

      {/* Error State */}
      {notesHook.error && (
        <ErrorMessage
          error={notesHook.error}
          onRetry={() => notesHook.refresh().catch(() => {})}
          onDismiss={notesHook.clearError}
        />
      )}

      <div>
        {/* Total count */}
        <TotalCountLabel
          totalCount={notesHook.totalCount}
          entityLabel={`note${notesHook.totalCount !== 1 ? 's' : ''}`}
        />

        {/* Reordering indicator */}
        {isReordering && (
          <div className='mb-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'>
            Saving order...
          </div>
        )}

        {/* Loading indicator (while searching) */}
        {notesHook.loading && (
          <div className='mb-3 flex justify-center'>
            <div className='h-5 w-5 animate-spin rounded-full border-b-2 border-primary-500'></div>
          </div>
        )}

        {/* Note list or empty state */}
        {!notesHook.loading && orderedNotes.length === 0 ? (
          isSearching ? (
            <EmptyState
              icon='🔍'
              title='No notes found'
              description={`No notes match "${notesHook.searchTerm}". Try a different search term.`}
              onRefresh={() => notesHook.setSearchTerm('')}
            />
          ) : (
            <EmptyState
              icon='📒'
              title='No notes yet'
              description='Click "Add" to create your first note card.'
              onRefresh={notesHook.refresh}
            />
          )
        ) : (
          <div className='space-y-3'>
            {orderedNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                index={index}
                isFirst={index === 0}
                isLast={index === orderedNotes.length - 1}
                showReorderControls={!isSearching}
                isDragging={dragIndex === index}
                isDragOver={dragOverIndex === index}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                onClick={() => navigate(`/note/${note.id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {notesHook.totalPages > 1 && (
          <div className='mt-6 flex items-center justify-center gap-3'>
            <button
              type='button'
              onClick={notesHook.previousPage}
              disabled={!notesHook.hasPrevious}
              className='focus-ring rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            >
              Previous
            </button>
            <span className='text-sm text-gray-500 dark:text-gray-400'>
              {notesHook.currentPage} / {notesHook.totalPages}
            </span>
            <button
              type='button'
              onClick={notesHook.nextPage}
              disabled={!notesHook.hasNext}
              className='focus-ring rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      <ToastContainer
        toasts={refreshToasts}
        onRemoveToast={removeRefreshToast}
      />
    </div>
  );
};
