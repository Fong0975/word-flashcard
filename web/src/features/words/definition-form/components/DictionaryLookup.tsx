import React from 'react';

import {
  CambridgeApiResponse,
  GroupedPronunciation,
  CambridgeDefinition,
  CambridgePronunciation,
} from '../types';

interface DictionaryLookupProps {
  wordText: string | null;
  dictionaryData: CambridgeApiResponse | null;
  isLoadingDictionary: boolean;
  dictionaryError: string | null;
  isCollapsed: boolean;
  onFetchDictionary: () => void;
  onToggleCollapsed: () => void;
  onApplyPronunciation: (ukUrl: string, usUrl: string, pos?: string) => void;
  onApplyDefinition: (definition: CambridgeDefinition) => void;
  groupPronunciationsByPos: (
    pronunciations: CambridgePronunciation[],
  ) => GroupedPronunciation[];
}

export const DictionaryLookup: React.FC<DictionaryLookupProps> = ({
  wordText,
  dictionaryData,
  isLoadingDictionary,
  dictionaryError,
  isCollapsed,
  onFetchDictionary,
  onToggleCollapsed,
  onApplyPronunciation,
  onApplyDefinition,
  groupPronunciationsByPos,
}) => {
  if (!wordText) {
    return null;
  }

  return (
    <div className='mb-4 overflow-hidden rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'>
      {/* Collapsible Header */}
      <div className='flex items-center justify-between p-4 transition-colors hover:bg-green-100 dark:hover:bg-green-900/40'>
        <h3 className='text-lg font-medium text-green-800 dark:text-green-200'>
          Dictionary Lookup
        </h3>
        <div className='flex items-center space-x-2'>
          <button
            type='button'
            onClick={onFetchDictionary}
            disabled={isLoadingDictionary}
            className='rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400'
          >
            {isLoadingDictionary ? (
              <>
                <svg
                  className='-ml-1 mr-2 inline h-4 w-4 animate-spin text-white'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Loading...
              </>
            ) : (
              'Fetch Definition'
            )}
          </button>
          <button
            type='button'
            onClick={onToggleCollapsed}
            className='p-2 text-green-600 transition-colors hover:text-green-900 focus:outline-none dark:text-green-300 dark:hover:text-green-100'
          >
            <svg
              className={`h-5 w-5 transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className='border-t border-green-200 bg-white dark:border-green-800 dark:bg-gray-800'>
          <div className='max-h-[45vh] space-y-4 overflow-y-auto p-4'>
            {/* Error Display */}
            {dictionaryError && (
              <div className='rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-300'>
                {dictionaryError}
              </div>
            )}

            {/* Empty State */}
            {!dictionaryError && !dictionaryData && (
              <div className='rounded-md p-3 text-sm text-gray-700 dark:text-gray-300'>
                No dictionary data available.
              </div>
            )}

            {/* Dictionary Data Display */}
            {dictionaryData && (
              <div className='space-y-4'>
                {/* Pronunciation Section */}
                {dictionaryData.pronunciation &&
                  dictionaryData.pronunciation.length > 0 && (
                    <div className='rounded-lg bg-gray-50 dark:bg-gray-800/50'>
                      <h4 className='mb-4 text-base font-medium text-gray-900 dark:text-gray-300'>
                        Pronunciation
                      </h4>
                      <div className='space-y-4'>
                        {groupPronunciationsByPos(dictionaryData.pronunciation)
                          .filter(group => group.uk || group.us)
                          .map((group, groupIndex) => (
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
                                        <source
                                          src={group.uk.url}
                                          type='audio/mpeg'
                                        />
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
                                        <source
                                          src={group.us.url}
                                          type='audio/mpeg'
                                        />
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
                  )}

                {/* Definitions Section */}
                {dictionaryData.definition &&
                  dictionaryData.definition.length > 0 && (
                    <div className='mt-3 space-y-3'>
                      <h4 className='mb-4 text-base font-medium text-gray-900 dark:text-gray-300'>
                        Definitions
                      </h4>
                      {dictionaryData.definition.map(def => (
                        <div
                          key={def.id}
                          className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'
                        >
                          <div className='mb-3 flex items-start justify-between'>
                            <div className='flex-1'>
                              <div className='mb-2 flex items-center space-x-2'>
                                <span className='inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-300'>
                                  {def.pos}
                                </span>
                              </div>
                              <p className='mb-2 text-sm text-gray-900 dark:text-gray-100'>
                                <span className='font-medium'>
                                  {def.translation}
                                </span>{' '}
                                {def.text}
                              </p>
                              {def.example && def.example.length > 0 && (
                                <div className='space-y-1'>
                                  <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                                    Examples:
                                  </p>
                                  {def.example.map(example => (
                                    <p
                                      key={example.id}
                                      className='text-xs italic text-gray-600 dark:text-gray-400'
                                    >
                                      • {example.text} {example.translation}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type='button'
                              onClick={() => onApplyDefinition(def)}
                              className='ml-4 flex-shrink-0 rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-200 dark:bg-green-800 dark:text-green-300 dark:hover:bg-green-700'
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
