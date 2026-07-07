import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Note } from '../../types/api';
import { apiService } from '../../lib/api';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useNotes } from '../../hooks/useNotes';
import { EmptyState } from '../../components/ui/EmptyState';
import { ToastContainer } from '../../components/ui';
import { useToast } from '../../hooks/ui/useToast';

import { NoteCard } from './NoteCard';

const ITEMS_PER_PAGE = 30;

export const NotesTab: React.FC = () => {
  const navigate = useNavigate();
  const notesHook = useNotes({ itemsPerPage: ITEMS_PER_PAGE });
  const { toasts, showError, removeToast } = useToast();

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
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (notesHook.error) {
    return (
      <div className='py-8 text-center'>
        <p className='mb-4 text-red-500 dark:text-red-400'>{notesHook.error}</p>
        <button
          type='button'
          onClick={notesHook.refresh}
          className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
        >
          Retry
        </button>
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
      </div>

      {/* Toolbar */}
      <div className='mb-4 flex items-center justify-end'>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={notesHook.refresh}
            disabled={notesHook.loading}
            className='flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          >
            <svg
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
            Refresh
          </button>
          <button
            type='button'
            onClick={() => navigate('/note/new')}
            className='flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700'
          >
            <svg
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
            Add Note
          </button>
        </div>
      </div>

      {/* Search input */}
      <div className='mb-4'>
        <div className='relative'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            <svg
              className='h-5 w-5 text-gray-400'
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
            className='block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-8 text-sm leading-5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
            placeholder='Search notes...'
          />
          {notesHook.searchTerm && (
            <button
              type='button'
              onClick={() => notesHook.setSearchTerm('')}
              className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
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

      {/* Total count */}
      {notesHook.totalCount > 0 && (
        <div className='flex justify-end'>
          <span className='text-xs text-gray-400 dark:text-gray-500'>
            {notesHook.totalCount} note{notesHook.totalCount !== 1 ? 's' : ''}{' '}
            total
          </span>
        </div>
      )}

      {/* Reordering indicator */}
      {isReordering && (
        <div className='mb-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'>
          Saving order...
        </div>
      )}

      {/* Loading indicator (while searching) */}
      {notesHook.loading && (
        <div className='mb-3 flex justify-center'>
          <div className='h-5 w-5 animate-spin rounded-full border-b-2 border-blue-500'></div>
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
            description='Click "Add Note" to create your first note card.'
            onRefresh={notesHook.refresh}
          />
        )
      ) : (
        <div className='space-y-2'>
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
            className='rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
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
            className='rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          >
            Next
          </button>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};
