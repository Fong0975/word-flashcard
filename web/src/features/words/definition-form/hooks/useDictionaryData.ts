import { useCallback } from 'react';

import { apiService } from '../../../../lib/api';
import { getApiErrorMessage } from '../../../../lib/apiErrorMessage';
import { useControllableState } from '../../../../hooks/shared/useControllableState';
import {
  CambridgeApiResponse,
  CambridgeDefinition,
  DefinitionForm,
} from '../types';
import {
  formatPronunciationSuccessMessage,
  formatDefinitionSuccessMessage,
} from '../utils/dictionaryFormatting';

export interface ExternalDictionaryState {
  dictionaryData: CambridgeApiResponse | null;
  isLoadingDictionary: boolean;
  dictionaryError: string | null;
  isCollapsed: boolean;
  setDictionaryData: (data: CambridgeApiResponse | null) => void;
  setIsLoadingDictionary: (loading: boolean) => void;
  setDictionaryError: (error: string | null) => void;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const useDictionaryData = (
  wordText: string | null,
  onShowSuccess?: (message: string) => void,
  onShowError?: (message: string) => void,
  externalState?: ExternalDictionaryState,
) => {
  const [dictionaryData, setDictionaryData] =
    useControllableState<CambridgeApiResponse | null>(
      externalState?.dictionaryData,
      externalState?.setDictionaryData,
      null,
    );

  const [isLoadingDictionary, setIsLoadingDictionary] =
    useControllableState<boolean>(
      externalState?.isLoadingDictionary,
      externalState?.setIsLoadingDictionary,
      false,
    );

  const [dictionaryError, setDictionaryError] = useControllableState<
    string | null
  >(externalState?.dictionaryError, externalState?.setDictionaryError, null);

  const [isCollapsed, setIsCollapsed] = useControllableState<boolean>(
    externalState?.isCollapsed,
    externalState?.setIsCollapsed,
    true,
  );

  // Fetch Cambridge Dictionary data
  const fetchDictionaryData = useCallback(async () => {
    if (!wordText) {
      setDictionaryError('No word available to search');
      return;
    }

    setIsLoadingDictionary(true);
    setDictionaryError(null);

    try {
      const data: CambridgeApiResponse =
        await apiService.lookupWord<CambridgeApiResponse>(wordText);
      setDictionaryData(data);
      setIsCollapsed(false); // Expand section after successful fetch
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        'Failed to fetch dictionary data',
      );
      setDictionaryError(errorMessage);
      if (onShowError) {
        onShowError('Error fetching dictionary data: ' + errorMessage);
      }
    } finally {
      setIsLoadingDictionary(false);
    }
  }, [
    wordText,
    onShowError,
    setDictionaryData,
    setDictionaryError,
    setIsLoadingDictionary,
    setIsCollapsed,
  ]);

  // Helper function to apply pronunciation data to form
  const applyPronunciation = useCallback(
    (
      ukUrl: string,
      usUrl: string,
      pos?: string,
      updateFormData?: (updates: Partial<DefinitionForm>) => void,
    ) => {
      if (updateFormData) {
        updateFormData({
          phonetics: {
            uk: ukUrl || '',
            us: usUrl || '',
          },
        });
      }

      if (onShowSuccess) {
        onShowSuccess(formatPronunciationSuccessMessage(ukUrl, usUrl, pos));
      }
    },
    [onShowSuccess],
  );

  // Helper function to apply definition data to form
  const applyDefinition = useCallback(
    (
      definition: CambridgeDefinition,
      updateFormData?: (updates: Partial<DefinitionForm>) => void,
    ) => {
      const examples = definition.example.map(
        ex => `${ex.text} ${ex.translation}`,
      );

      if (updateFormData) {
        updateFormData({
          part_of_speech: definition.pos ? [definition.pos] : [],
          definition: `${definition.translation} ${definition.text}`,
          examples: examples.length > 0 ? examples : [],
        });
      }

      if (onShowSuccess) {
        onShowSuccess(
          formatDefinitionSuccessMessage(definition, examples.length),
        );
      }
    },
    [onShowSuccess],
  );

  // Reset dictionary data when needed
  const resetDictionaryData = useCallback(() => {
    setDictionaryData(null);
    setDictionaryError(null);
    setIsCollapsed(true);
  }, [setDictionaryData, setDictionaryError, setIsCollapsed]);

  // Toggle collapsed state
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  return {
    // State
    dictionaryData,
    isLoadingDictionary,
    dictionaryError,
    isCollapsed,

    // Actions
    fetchDictionaryData,
    applyPronunciation,
    applyDefinition,
    resetDictionaryData,
    toggleCollapsed,
  };
};
