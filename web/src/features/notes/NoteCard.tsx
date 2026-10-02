import React from 'react';

import { Note } from '../../types/api';
import { formatNoteDate } from '../../utils/dateFormat';

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
        showReorderControls && isDragging
          ? 'opacity-50'
          : showReorderControls && isDragOver
            ? 'border-primary-400 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/20'
            : 'glass-panel-card glass-card-hover'
      } ${showReorderControls ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Drag handle — hidden during search */}
      {showReorderControls && (
        <div className='text-subtle flex-shrink-0'>
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
            className='focus-ring text-subtle rounded p-0.5 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700 dark:hover:text-gray-300'
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
            className='focus-ring text-subtle rounded p-0.5 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700 dark:hover:text-gray-300'
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
        className='focus-ring min-w-0 flex-1 rounded-md text-left'
      >
        <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
          {note.title}
        </p>
        <p className='text-supporting text-xs'>
          {formatNoteDate(note.updated_at)}
        </p>
      </button>

      {/* Right chevron */}
      <div className='flex-shrink-0'>
        <svg
          className='text-subtle h-5 w-5 transition-colors group-hover:text-primary-500 dark:group-hover:text-primary-400'
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
