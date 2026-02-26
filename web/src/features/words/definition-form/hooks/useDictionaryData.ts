import { useState, useCallback } from 'react';

import { apiService } from '../../../../lib/api';
import { CambridgeApiResponse, CambridgePronunciation, CambridgeDefinition, GroupedPronunciation, DefinitionForm } from '../types';

export const useDictionaryData = (
  wordText: string | null,
  onShowSuccess?: (message: string) => void,
  onShowError?: (message: string) => void,
) => {
  // Dictionary data state
  const [dictionaryData, setDictionaryData] = useState<CambridgeApiResponse | null>(null);
  const [isLoadingDictionary, setIsLoadingDictionary] = useState(false);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Fetch Cambridge Dictionary data
  const fetchDictionaryData = useCallback(async () => {
    if (!wordText) {
      setDictionaryError('No word available to search');
      return;
    }

    setIsLoadingDictionary(true);
    setDictionaryError(null);

    try {
      const data: CambridgeApiResponse = await apiService.lookupWord<CambridgeApiResponse>(wordText);
      setDictionaryData(data);
      setIsCollapsed(false); // Expand section after successful fetch
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dictionary data';
      setDictionaryError(errorMessage);
      if (onShowError) {
        onShowError('Error fetching dictionary data: ' + errorMessage);
      }
    } finally {
      setIsLoadingDictionary(false);
    }
  }, [wordText, onShowError]);

  // Helper function to group pronunciations by position
  const groupPronunciationsByPos = useCallback((pronunciations: CambridgePronunciation[]): GroupedPronunciation[] => {
    const groups = pronunciations.reduce((acc, pron) => {
      const pos = pron.pos || 'general';
      if (!acc[pos]) {
        acc[pos] = { uk: null, us: null };
      }
      if (pron.lang === 'uk') {
        acc[pos].uk = pron;
      } else if (pron.lang === 'us') {
        acc[pos].us = pron;
      }
      return acc;
    }, {} as Record<string, { uk: CambridgePronunciation | null; us: CambridgePronunciation | null }>);

    return Object.entries(groups).map(([pos, group]) => ({
      pos,
      uk: group.uk,
      us: group.us,
    }));
  }, []);

  // Helper function to apply pronunciation data to form
  const applyPronunciation = useCallback((
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

    // Show success message
    const appliedUrls = [];
    if (ukUrl) {appliedUrls.push('UK');}
    if (usUrl) {appliedUrls.push('US');}

    let successText = '';
    if (appliedUrls.length > 0) {
      const urlText = appliedUrls.join(' and ');
      successText = `${urlText} pronunciation URL${appliedUrls.length > 1 ? 's' : ''}`;
      if (pos && pos !== 'general') {
        successText += ` (${pos})`;
      }
      successText += ' applied successfully!';
    } else {
      successText = 'Pronunciation data applied successfully!';
    }

    if (onShowSuccess) {
      onShowSuccess(successText);
    }
  }, [onShowSuccess]);

  // Helper function to apply definition data to form
  const applyDefinition = useCallback((
    definition: CambridgeDefinition,
    updateFormData?: (updates: Partial<DefinitionForm>) => void,
  ) => {
    const examples = definition.example.map(ex => `${ex.text} ${ex.translation}`);

    if (updateFormData) {
      updateFormData({
        part_of_speech: definition.pos ? [definition.pos] : [],
        definition: `${definition.translation} ${definition.text}`,
        examples: examples.length > 0 ? examples : [],
      });
    }

    // Show success message
    const itemsApplied = [];
    if (definition.pos) {itemsApplied.push('part of speech');}
    itemsApplied.push('definition');
    if (examples.length > 0) {itemsApplied.push(`${examples.length} example${examples.length > 1 ? 's' : ''}`);}

    if (onShowSuccess) {
      onShowSuccess(`Applied ${itemsApplied.join(', ')} successfully!`);
    }
  }, [onShowSuccess]);

  // Reset dictionary data when needed
  const resetDictionaryData = useCallback(() => {
    setDictionaryData(null);
    setDictionaryError(null);
    setIsCollapsed(true);
  }, []);

  // Toggle collapsed state
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

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

    // Utilities
    groupPronunciationsByPos,
  };
};