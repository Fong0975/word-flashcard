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
          className='glass-button-primary mt-4 rounded-md px-6 py-2 text-sm font-medium'
        >
          Back to Home
        </button>
      </div>
    }
  />
);
