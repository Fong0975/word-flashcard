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
          className='focus-ring text-supporting rounded-sm text-xs underline-offset-2 hover:text-gray-900 hover:underline focus-visible:text-gray-900 focus-visible:underline dark:hover:text-gray-200 dark:focus-visible:text-gray-200'
        >
          {text}
        </button>
      ) : (
        <span className='text-supporting text-xs'>{text}</span>
      )}
    </div>
  );
};
