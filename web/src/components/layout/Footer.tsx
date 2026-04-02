import React from 'react';

import pkg from '../../../package.json';
import { useApiVersion } from '../../contexts/ApiVersionContext';

const VersionTooltip: React.FC<{
  label: string;
  apiVersion: string | null;
}> = ({ label, apiVersion }) => (
  <span className='group relative inline-block cursor-default'>
    <span className='text-xs opacity-60'>{label}</span>
    <span className='pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-600'>
      <span className='block'>Web: v{pkg.version}</span>
      <span className='block'>API: v{apiVersion ?? '—'}</span>
    </span>
  </span>
);

export const Footer: React.FC = () => {
  const { apiVersion } = useApiVersion();

  return (
    <footer className='border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
      <div className='mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8'>
        <p className='text-center text-sm text-gray-500 dark:text-gray-400'>
          {/* Mobile */}
          <span className='inline md:hidden'>
            © {new Date().getFullYear()} SWind · Flashcard{' '}
            <VersionTooltip label={`v${pkg.version}`} apiVersion={apiVersion} />
          </span>

          {/* Tablet/PC */}
          <span className='hidden md:inline'>
            Copyright © {new Date().getFullYear()} SWind All rights reserved. |{' '}
            <VersionTooltip
              label={`Build ${pkg.version}`}
              apiVersion={apiVersion}
            />
          </span>
        </p>
      </div>
    </footer>
  );
};
