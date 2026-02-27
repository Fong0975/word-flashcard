import React from 'react';

import { useDarkMode } from '../../hooks/useDarkMode';
import { logo } from '../../assets/images';

export const Header: React.FC = () => {
  const { isDarkMode, toggleTheme } = useDarkMode();

  return (
    <header className='border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo and Title */}
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-3'>
              <img
                src={logo}
                alt='Flashcard App Logo'
                className='h-10 w-10 rounded-lg'
              />
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Flashcard
              </h1>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className='flex items-center'>
            <button
              onClick={toggleTheme}
              className='rounded-md p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
              aria-label={
                isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
              }
            >
              <span className={isDarkMode ? 'hidden' : 'block'}>🌙</span>
              <span className={isDarkMode ? 'block' : 'hidden'}>☀️</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
