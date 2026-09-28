import React from 'react';

interface TotalCountLabelProps {
  totalCount: number;
  /** Fully composed label text following the count, e.g. `'words'` or `'note'`. */
  entityLabel: string;
  onClick?: () => void;
}

/**
 * Right-aligned "N <entity> total" caption shown above an entity list.
 * Shared across word/question/note review tabs so the label always lines up
 * with the right edge of the (full-width) card list beneath it, with the
 * same spacing below it, regardless of which tab renders it.
 */
export const TotalCountLabel: React.FC<TotalCountLabelProps> = ({
  totalCount,
  entityLabel,
  onClick,
}) => {
  if (totalCount === 0) {
    return null;
  }

  const text = `${totalCount} ${entityLabel} total`;

  return (
    <div className='mb-2 flex justify-end'>
      {onClick ? (
        <button
          type='button'
          onClick={onClick}
          className='text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline dark:text-gray-500 dark:hover:text-gray-300'
        >
          {text}
        </button>
      ) : (
        <span className='text-xs text-gray-400 dark:text-gray-500'>{text}</span>
      )}
    </div>
  );
};
