import React from 'react';

import { CambridgeApiResponse, CambridgeDefinition } from '../types';

import { DictionaryLookupHeader } from './DictionaryLookupHeader';
import { PronunciationSection } from './PronunciationSection';
import { DefinitionsSection } from './DefinitionsSection';

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
}) => {
  if (!wordText) {
    return null;
  }

  return (
    <div className='mb-4 overflow-hidden rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'>
      <DictionaryLookupHeader
        isLoadingDictionary={isLoadingDictionary}
        isCollapsed={isCollapsed}
        onFetchDictionary={onFetchDictionary}
        onToggleCollapsed={onToggleCollapsed}
      />

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
                <PronunciationSection
                  pronunciations={dictionaryData.pronunciation}
                  onApplyPronunciation={onApplyPronunciation}
                />
                <DefinitionsSection
                  definitions={dictionaryData.definition}
                  onApplyDefinition={onApplyDefinition}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
