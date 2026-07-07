import React from 'react';

import { Word } from '../../../../types/api';
import { getFamiliarityColor } from '../../../shared/constants/familiarity';

import { PronunciationControls } from './PronunciationControls';

interface WordQuestionDisplayProps {
  word: Word;
  pronunciationUrls: { uk?: string | null; us?: string | null };
  hasUkUrl: boolean;
  hasUsUrl: boolean;
}

export const WordQuestionDisplay: React.FC<WordQuestionDisplayProps> = ({
  word,
  pronunciationUrls,
  hasUkUrl,
  hasUsUrl,
}) => (
  <div className='flex flex-1 flex-col items-center justify-center'>
    <h1 className='mb-6 break-all text-center text-4xl font-bold text-gray-900 dark:text-white md:text-4xl lg:text-8xl'>
      {word.word}
    </h1>

    {/* Familiarity Bar */}
    {word.familiarity && (
      <div className='mb-4 text-center'>
        <div
          className={`mx-auto h-2 w-64 rounded-full transition-colors duration-300 ${getFamiliarityColor(word.familiarity)}`}
        />
      </div>
    )}

    {/* Part of Speech */}
    <div className='my-3'>
      {Array.from(
        new Set(
          word.definitions?.map(def => def.part_of_speech)?.filter(Boolean),
        ),
      ).map((pos, index) => (
        <span
          key={index}
          className='mx-1 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        >
          {pos}
        </span>
      ))}
    </div>

    {/* Definition count */}
    {word.definitions && word.definitions.length > 0 && (
      <div className='mb-2 flex justify-between text-sm text-gray-700 dark:text-gray-300'>
        Total {word.definitions.length} definition
        {word.definitions.length > 1 ? 's' : ''}
      </div>
    )}
    <p className='mb-8 text-xs text-gray-400 dark:text-gray-500'>
      Practice #{word.count_practise + 1}
    </p>

    {/* Pronunciation buttons */}
    <PronunciationControls
      word={word.word}
      pronunciationUrls={pronunciationUrls}
      hasUkUrl={hasUkUrl}
      hasUsUrl={hasUsUrl}
    />
  </div>
);
