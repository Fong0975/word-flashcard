import React from 'react';

import { Word } from '../../../../types/api';
import { getFamiliarityColor } from '../../../shared/constants/familiarity';

interface WordQuizNavHeaderProps {
  currentWordIndex: number;
  totalWords: number;
  progress: number;
  isFirstStep: boolean;
  showAnswer: boolean;
  currentWord: Word;
  onPrev: () => void;
  onNext: () => void;
}

export const WordQuizNavHeader: React.FC<WordQuizNavHeaderProps> = ({
  currentWordIndex,
  totalWords,
  progress,
  isFirstStep,
  showAnswer,
  currentWord,
  onPrev,
  onNext,
}) => (
  <div className='mb-6 flex-shrink-0'>
    {/* Navigation + Progress Bar */}
    <div className='flex items-center gap-3'>
      {/* Prev button */}
      <button
        onClick={onPrev}
        disabled={isFirstStep}
        aria-label='Previous'
        className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      >
        <svg
          className='h-4 w-4'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M15.75 19.5L8.25 12l7.5-7.5'
          />
        </svg>
      </button>

      {/* Progress info + bar */}
      <div className='flex-1'>
        <div className='mb-2 flex justify-between text-sm text-gray-600 dark:text-gray-400'>
          <span>
            Question {currentWordIndex + 1} of {totalWords}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
          <div
            className='h-2 rounded-full bg-primary-500 transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        aria-label='Next'
        className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      >
        <svg
          className='h-4 w-4'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M8.25 4.5l7.5 7.5-7.5 7.5'
          />
        </svg>
      </button>
    </div>

    {showAnswer && (
      <div className='mb-2 mt-4 text-center md:mb-4 md:mt-8'>
        {/* Centered Word Display */}
        <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-4xl lg:text-6xl'>
          {currentWord.word}
        </h1>

        {/* Familiarity Bar */}
        {currentWord.familiarity && (
          <div className='mb-2 text-center md:mb-4'>
            <div
              className={`mx-auto h-2 w-40 rounded-full transition-colors duration-300 ${getFamiliarityColor(currentWord.familiarity)}`}
            />
          </div>
        )}
      </div>
    )}
  </div>
);
