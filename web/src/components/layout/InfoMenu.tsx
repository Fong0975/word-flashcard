import React from 'react';

import pkg from '../../../package.json';
import { useApiVersion } from '../../contexts/ApiVersionContext';

const GITHUB_URL = 'https://github.com/Fong0975/word-flashcard';

/**
 * Info button in the header, showing the app/API version and copyright
 * notice on hover or focus, along with a link to the GitHub repository.
 */
export const InfoMenu: React.FC = () => {
  const { apiVersion } = useApiVersion();
  const year = new Date().getFullYear();

  return (
    <div className='group relative'>
      <button
        type='button'
        className='rounded-md p-2 text-gray-500 transition-colors duration-200 focus:outline-none group-focus-within:bg-gray-100 group-focus-within:text-gray-900 group-hover:bg-gray-100 group-hover:text-gray-900 dark:text-gray-400 dark:group-focus-within:bg-gray-700 dark:group-focus-within:text-white dark:group-hover:bg-gray-700 dark:group-hover:text-white'
        aria-label='Info'
        aria-haspopup='true'
      >
        <svg
          viewBox='0 0 24 24'
          className='h-5 w-5 scale-100 transition-transform duration-300 ease-out group-focus-within:-translate-y-0.5 group-focus-within:scale-110 group-hover:-translate-y-0.5 group-hover:scale-110'
          fill='none'
          stroke='currentColor'
          strokeWidth={1.5}
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M11.25 8.25h.008v.008h-.008V8.25Z'
          />
        </svg>
      </button>

      <div className='absolute right-0 top-full z-10 hidden w-80 max-w-[calc(100vw-2rem)] pt-2 group-focus-within:block group-hover:block'>
        <div className='rounded-md bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-600'>
          <p className='text-sm text-gray-700 dark:text-gray-200'>
            <span className='font-extrabold'>Flashcard v{pkg.version}</span>{' '}
            <span className='font-light text-gray-500 dark:text-gray-400'>
              (API v{apiVersion ?? '—'})
            </span>
          </p>
          <p className='mt-1 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400'>
            Copyright © {year} SWind All rights reserved.
          </p>
          <a
            href={GITHUB_URL}
            target='_blank'
            rel='noopener noreferrer'
            role='menuitem'
            className='mt-2 flex items-center gap-1.5 rounded-md pt-1 text-xs text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-200 dark:hover:text-white'
          >
            <svg
              viewBox='0 0 24 24'
              className='h-4 w-4'
              fill='currentColor'
              aria-hidden='true'
            >
              <path d='M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.021C22 6.484 17.522 2 12 2z' />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
};
