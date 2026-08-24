import React from 'react';
import { Link } from 'react-router-dom';

import { useDarkMode } from '../../hooks/useDarkMode';
import logo from '../../assets/images/logo.png';

import { DataManagementMenu } from './DataManagementMenu';
import { InfoMenu } from './InfoMenu';

export const Header: React.FC = () => {
  const { isDarkMode, toggleTheme } = useDarkMode();

  return (
    <header className='border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo and Title */}
          <div className='flex items-center space-x-4'>
            <Link to='/' className='flex items-center space-x-3'>
              <img
                src={logo}
                alt='Flashcard App Logo'
                className='h-10 w-10 rounded-lg'
              />
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Flashcard
              </h1>
            </Link>
          </div>

          {/* Actions */}
          <div className='flex items-center space-x-1'>
            <button
              onClick={toggleTheme}
              className='group rounded-md p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
              aria-label={
                isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
              }
            >
              {/* Moon: shown in light mode; hovering tilts it, like peeking at the night ahead */}
              <svg
                viewBox='0 0 24 24'
                className={`transition-transform duration-300 ease-out group-hover:-rotate-12 ${
                  isDarkMode ? 'hidden h-5 w-5' : 'block h-5 w-5'
                }`}
                fill='none'
                stroke='currentColor'
                strokeWidth={1.5}
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z'
                />
              </svg>
              {/* Sun: shown in dark mode; hovering spins it like rays sweeping round */}
              <svg
                viewBox='0 0 24 24'
                className={`transition-transform duration-500 ease-out group-hover:rotate-180 ${
                  isDarkMode ? 'block h-5 w-5' : 'hidden h-5 w-5'
                }`}
                fill='none'
                stroke='currentColor'
                strokeWidth={1.5}
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z'
                />
              </svg>
            </button>
            <DataManagementMenu />
            <InfoMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
