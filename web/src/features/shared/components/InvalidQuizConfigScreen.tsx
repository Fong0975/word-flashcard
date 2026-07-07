import React from 'react';

import { DetailPageLayout } from '../../../components/layout';

interface InvalidQuizConfigScreenProps {
  onBackToHome: () => void;
}

export const InvalidQuizConfigScreen: React.FC<
  InvalidQuizConfigScreenProps
> = ({ onBackToHome }) => (
  <DetailPageLayout
    onBack={onBackToHome}
    body={
      <div className='flex flex-1 flex-col items-center justify-center'>
        <div className='mb-4 text-6xl'>😕</div>
        <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
          Invalid quiz configuration
        </h3>
        <button
          type='button'
          onClick={onBackToHome}
          className='mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700'
        >
          Back to Home
        </button>
      </div>
    }
  />
);
