import React from 'react';

import pkg from '../../../package.json';

export const Footer: React.FC = () => {
  return (
    <footer className='border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
      <div className='mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8'>
        <p className='text-center text-sm text-gray-500 dark:text-gray-400'>
          © {new Date().getFullYear()} Flashcard. Designed for efficient
          learning. <span className='text-xs opacity-60'>v{pkg.version}</span>
        </p>
      </div>
    </footer>
  );
};
