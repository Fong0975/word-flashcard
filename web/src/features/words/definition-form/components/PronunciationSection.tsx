import React from 'react';

import { CambridgePronunciation } from '../types';
import { groupPronunciationsByPos } from '../utils/dictionaryFormatting';

interface PronunciationSectionProps {
  pronunciations: CambridgePronunciation[];
  onApplyPronunciation: (ukUrl: string, usUrl: string, pos?: string) => void;
}

export const PronunciationSection: React.FC<PronunciationSectionProps> = ({
  pronunciations,
  onApplyPronunciation,
}) => {
  if (!pronunciations || pronunciations.length === 0) {
    return null;
  }

  const groups = groupPronunciationsByPos(pronunciations).filter(
    group => group.uk || group.us,
  );

  return (
    <div className='rounded-lg bg-gray-50 dark:bg-gray-800/50'>
      <h4 className='mb-4 text-base font-medium text-gray-900 dark:text-gray-300'>
        Pronunciation
      </h4>
      <div className='space-y-4'>
        {groups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className='rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/30'
          >
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                {group.pos !== 'general' && (
                  <span className='inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-300'>
                    {group.pos}
                  </span>
                )}
                <span className='text-sm font-medium text-blue-900 dark:text-blue-300'>
                  {group.pos === 'general'
                    ? 'General Pronunciation'
                    : `${group.pos} pronunciation`}
                </span>
              </div>
              <button
                type='button'
                onClick={() => {
                  onApplyPronunciation(
                    group.uk?.url || '',
                    group.us?.url || '',
                    group.pos,
                  );
                }}
                disabled={!group.uk?.url && !group.us?.url}
                className='rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-800 dark:text-blue-300 dark:hover:bg-blue-700'
              >
                Apply
              </button>
            </div>
            <div className='space-y-2'>
              {group.uk && (
                <div className='flex items-center justify-between text-sm'>
                  <div className='flex items-center space-x-2'>
                    <span className='font-medium uppercase text-blue-800 dark:text-blue-300'>
                      UK:
                    </span>
                    <span className='text-gray-700 dark:text-gray-300'>
                      {group.uk.pron}
                    </span>
                  </div>
                  {group.uk.url && (
                    <audio controls className='w-32'>
                      <source src={group.uk.url} type='audio/mpeg' />
                    </audio>
                  )}
                </div>
              )}
              {group.us && (
                <div className='flex items-center justify-between text-sm'>
                  <div className='flex items-center space-x-2'>
                    <span className='font-medium uppercase text-blue-800 dark:text-blue-300'>
                      US:
                    </span>
                    <span className='text-gray-700 dark:text-gray-300'>
                      {group.us.pron}
                    </span>
                  </div>
                  {group.us.url && (
                    <audio controls className='w-32'>
                      <source src={group.us.url} type='audio/mpeg' />
                    </audio>
                  )}
                </div>
              )}
              {!group.uk && group.us && (
                <div className='text-xs italic text-gray-500 dark:text-gray-400'>
                  UK pronunciation not available
                </div>
              )}
              {group.uk && !group.us && (
                <div className='text-xs italic text-gray-500 dark:text-gray-400'>
                  US pronunciation not available
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
