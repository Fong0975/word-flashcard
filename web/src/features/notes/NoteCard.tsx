import React from 'react';

import { Note } from '../../types/api';

interface NoteCardProps {
  note: Note;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  showReorderControls?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) {
    return '-';
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isFirst,
  isLast,
  isDragging,
  isDragOver,
  showReorderControls = true,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onClick,
}) => {
  return (
    <div
      draggable={showReorderControls}
      onDragStart={showReorderControls ? onDragStart : undefined}
      onDragOver={showReorderControls ? onDragOver : undefined}
      onDrop={showReorderControls ? onDrop : undefined}
      onDragEnd={showReorderControls ? onDragEnd : undefined}
      className={`group flex items-center gap-3 rounded-lg border p-3 transition-all ${
        showReorderControls
          ? isDragging
            ? 'opacity-50'
            : isDragOver
              ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
      } ${showReorderControls ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Drag handle — hidden during search */}
      {showReorderControls && (
        <div className='flex-shrink-0 text-gray-300 dark:text-gray-600'>
          <svg
            className='h-5 w-5'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 8h16M4 16h16'
            />
          </svg>
        </div>
      )}

      {/* Move up/down buttons — hidden during search */}
      {showReorderControls && (
        <div className='flex flex-shrink-0 flex-col gap-0.5'>
          <button
            type='button'
            onClick={e => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            className='rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300'
            aria-label='Move up'
          >
            <svg
              className='h-3.5 w-3.5'
              viewBox='0 0 24 24'
              fill='currentColor'
            >
              <path d='M12 5l-7 7h4v7h6v-7h4z' />
            </svg>
          </button>
          <button
            type='button'
            onClick={e => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            className='rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300'
            aria-label='Move down'
          >
            <svg
              className='h-3.5 w-3.5'
              viewBox='0 0 24 24'
              fill='currentColor'
            >
              <path d='M12 19l7-7h-4V5H9v7H5z' />
            </svg>
          </button>
        </div>
      )}

      {/* Note content - clickable */}
      <button
        type='button'
        onClick={onClick}
        className='min-w-0 flex-1 text-left'
      >
        <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
          {note.title}
        </p>
        <p className='text-xs text-gray-400 dark:text-gray-500'>
          {formatDate(note.updated_at)}
        </p>
      </button>

      {/* Right chevron */}
      <div className='flex-shrink-0'>
        <svg
          className='h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 5l7 7-7 7'
          />
        </svg>
      </div>
    </div>
  );
};
