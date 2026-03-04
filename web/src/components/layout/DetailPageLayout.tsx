import React from 'react';

import { Header } from './Header';
import { Footer } from './Footer';

interface DetailPageLayoutProps {
  onBack: () => void;
  header?: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}

const hasContent = (value: React.ReactNode): boolean =>
  value !== null && value !== undefined;

export const DetailPageLayout: React.FC<DetailPageLayoutProps> = ({
  onBack,
  header,
  body,
  footer,
}) => (
  <div className='flex h-screen flex-col overflow-hidden bg-gray-50 pt-[env(safe-area-inset-top)] transition-colors duration-300 dark:bg-gray-900'>
    <Header />
    <main className='flex flex-1 flex-col overflow-hidden'>
      <div className='mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-4 py-4 sm:px-3 lg:px-10'>
        <button
          type='button'
          onClick={onBack}
          className='mb-3 flex flex-shrink-0 items-center space-x-2 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
          aria-label='Go back'
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
              d='M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18'
            />
          </svg>
          <span className='text-sm font-medium'>Back</span>
        </button>

        {/* Content card */}
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
          {hasContent(header) && (
            <div className='flex-shrink-0 px-3 pt-3 lg:px-6 lg:pt-6'>
              {header}
            </div>
          )}
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-3 ${
              !hasContent(header) ? 'pt-3' : 'pt-2'
            } ${!hasContent(footer) ? 'pb-3' : 'pb-2'} lg:px-6 ${
              !hasContent(header) ? 'lg:pt-6' : 'lg:pt-4'
            } ${!hasContent(footer) ? 'lg:pb-6' : 'lg:pb-4'}`}
          >
            {body}
          </div>
          {hasContent(footer) && (
            <div className='flex-shrink-0 px-3 py-3 lg:px-6 lg:py-6'>
              {footer}
            </div>
          )}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);
