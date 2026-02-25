import React from 'react';
import { CambridgeApiResponse, GroupedPronunciation, CambridgeDefinition, DefinitionForm } from '../types';
import { SuccessNotification } from './SuccessNotification';

interface DictionaryLookupProps {
  wordText: string | null;
  dictionaryData: CambridgeApiResponse | null;
  isLoadingDictionary: boolean;
  dictionaryError: string | null;
  isCollapsed: boolean;
  successMessage: string | null;
  onFetchDictionary: () => void;
  onToggleCollapsed: () => void;
  onApplyPronunciation: (ukUrl: string, usUrl: string, pos?: string) => void;
  onApplyDefinition: (definition: CambridgeDefinition) => void;
  onClearSuccessMessage: () => void;
  groupPronunciationsByPos: (pronunciations: any[]) => GroupedPronunciation[];
}

export const DictionaryLookup: React.FC<DictionaryLookupProps> = ({
  wordText,
  dictionaryData,
  isLoadingDictionary,
  dictionaryError,
  isCollapsed,
  successMessage,
  onFetchDictionary,
  onToggleCollapsed,
  onApplyPronunciation,
  onApplyDefinition,
  onClearSuccessMessage,
  groupPronunciationsByPos
}) => {
  if (!wordText) return null;

  return (
    <div className="mb-4 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Dictionary Lookup
        </h3>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onFetchDictionary}
            disabled={isLoadingDictionary}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            {isLoadingDictionary ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              'Fetch Definition'
            )}
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none transition-colors"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dictionary Content */}
      {!isCollapsed && (
        <div className="space-y-4 border-gray-200 dark:border-gray-700 pt-4">
          {/* Success Notification */}
          {successMessage && (
            <SuccessNotification
              message={successMessage}
              onClose={onClearSuccessMessage}
            />
          )}

          {/* Error Display */}
          {dictionaryError && (
            <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-md">
              {dictionaryError}
            </div>
          )}

          {/* Dictionary Data Display */}
          {dictionaryData && (
            <div className="space-y-4">
              {/* Pronunciation Section */}
              {dictionaryData.pronunciation && dictionaryData.pronunciation.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-blue-900 dark:text-blue-300 mb-4">
                    Pronunciation
                  </h4>
                  <div className="space-y-4">
                    {groupPronunciationsByPos(dictionaryData.pronunciation)
                      .filter(group => group.uk || group.us)
                      .map((group, groupIndex) => (
                        <div key={groupIndex} className="border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-white dark:bg-blue-800/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {group.pos !== 'general' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300">
                                  {group.pos}
                                </span>
                              )}
                              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                {group.pos === 'general' ? 'General Pronunciation' : `${group.pos} pronunciation`}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onApplyPronunciation(
                                  group.uk?.url || '',
                                  group.us?.url || '',
                                  group.pos
                                );
                              }}
                              disabled={!group.uk?.url && !group.us?.url}
                              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-300 dark:hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Apply
                            </button>
                          </div>
                          <div className="space-y-2">
                            {group.uk && (
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-blue-800 dark:text-blue-300 uppercase">
                                    UK:
                                  </span>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {group.uk.pron}
                                  </span>
                                </div>
                                {group.uk.url && (
                                  <audio controls className="w-32">
                                    <source src={group.uk.url} type="audio/mpeg" />
                                  </audio>
                                )}
                              </div>
                            )}
                            {group.us && (
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-blue-800 dark:text-blue-300 uppercase">
                                    US:
                                  </span>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {group.us.pron}
                                  </span>
                                </div>
                                {group.us.url && (
                                  <audio controls className="w-32">
                                    <source src={group.us.url} type="audio/mpeg" />
                                  </audio>
                                )}
                              </div>
                            )}
                            {!group.uk && group.us && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                UK pronunciation not available
                              </div>
                            )}
                            {group.uk && !group.us && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
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
              {dictionaryData.definition && dictionaryData.definition.length > 0 && (
                <div className="space-y-3">
                  {dictionaryData.definition.map((def) => (
                    <div key={def.id} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300">
                              {def.pos}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                            <span className="font-medium">{def.translation}</span> {def.text}
                          </p>
                          {def.example && def.example.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Examples:</p>
                              {def.example.map((example) => (
                                <p key={example.id} className="text-xs text-gray-600 dark:text-gray-400 italic">
                                  • {example.text} {example.translation}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onApplyDefinition(def)}
                          className="ml-4 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:text-green-300 dark:hover:bg-green-700 rounded transition-colors flex-shrink-0"
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
      )}
    </div>
  );
};