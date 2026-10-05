import React from 'react';

import { Word } from '../../../../types/api';
import { FamiliarityBar } from '../../../shared/components/FamiliarityBar';

import { PronunciationControls } from './PronunciationControls';

interface WordQuestionDisplayProps {
  word: Word;
  /** Familiarity to show; defaults to the word's stored level. */
  familiarity?: string;
  pronunciationUrls: { uk?: string | null; us?: string | null };
  hasUkUrl: boolean;
  hasUsUrl: boolean;
}

export const WordQuestionDisplay: React.FC<WordQuestionDisplayProps> = ({
  word,
  familiarity = word.familiarity,
  pronunciationUrls,
  hasUkUrl,
  hasUsUrl,
}) => (
  <div className='flex flex-1 flex-col items-center justify-center'>
    <h1 className='mb-6 break-all text-center text-4xl font-bold text-gray-900 dark:text-white md:text-4xl lg:text-8xl'>
      {word.word}
    </h1>

    <FamiliarityBar familiarity={familiarity} className='mb-4 w-64' />

    {/* Part of Speech */}
    <div className='my-3'>
      {Array.from(
        new Set(
          word.definitions?.map(def => def.part_of_speech)?.filter(Boolean),
        ),
      ).map((pos, index) => (
        <span
          key={index}
          className='mx-1 inline-block rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200'
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
    <p className='text-supporting mb-8 text-xs'>
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
