import React from 'react';
import { Link } from 'react-router-dom';

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
            <a
              href='https://github.com/Fong0975/word-flashcard'
              target='_blank'
              rel='noopener noreferrer'
              className='rounded-md p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
              aria-label='View source on GitHub'
            >
              <svg
                viewBox='0 0 24 24'
                className='h-5 w-5'
                fill='currentColor'
                aria-hidden='true'
              >
                <path d='M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.021C22 6.484 17.522 2 12 2z' />
              </svg>
            </a>
            <div className='group relative'>
              <button
                type='button'
                className='rounded-md p-2 text-gray-500 transition-colors duration-200 focus:outline-none group-focus-within:bg-gray-100 group-focus-within:text-gray-900 group-hover:bg-gray-100 group-hover:text-gray-900 dark:text-gray-400 dark:group-focus-within:bg-gray-700 dark:group-focus-within:text-white dark:group-hover:bg-gray-700 dark:group-hover:text-white'
                aria-label='Settings'
                aria-haspopup='true'
              >
                <svg
                  viewBox='0 0 24 24'
                  className='h-5 w-5'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={1.5}
                  aria-hidden='true'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.216.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7.665 7.665 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
                  />
                </svg>
              </button>

              <div className='absolute right-0 top-full z-10 hidden w-40 pt-2 group-focus-within:block group-hover:block'>
                <div
                  className='rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-600'
                  role='menu'
                >
                  <div className='py-1'>
                    <span className='block px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500'>
                      Data
                    </span>
                    <button
                      type='button'
                      role='menuitem'
                      className='block w-full py-1.5 pl-8 pr-4 text-left text-xs text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white'
                    >
                      Import
                    </button>
                    <button
                      type='button'
                      role='menuitem'
                      className='block w-full py-1.5 pl-8 pr-4 text-left text-xs text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white'
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
