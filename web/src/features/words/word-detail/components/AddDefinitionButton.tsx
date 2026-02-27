import React from 'react';

interface AddDefinitionButtonProps {
  onClick: () => void;
}

export const AddDefinitionButton: React.FC<AddDefinitionButtonProps> = ({
  onClick,
}) => {
  return (
    <div className='mb-4 flex justify-end'>
      <button
        type='button'
        onClick={onClick}
        className='rounded-md p-2 text-gray-600 transition-colors hover:bg-green-50 hover:text-green-600 dark:text-gray-400 dark:hover:bg-green-900/20 dark:hover:text-green-400'
        title='Add new definition'
      >
        <svg
          className='h-5 w-5'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M12 4.5v15m7.5-7.5h-15'
          />
        </svg>
      </button>
    </div>
  );
};
