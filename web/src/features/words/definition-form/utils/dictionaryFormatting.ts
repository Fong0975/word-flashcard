import {
  CambridgePronunciation,
  CambridgeDefinition,
  GroupedPronunciation,
} from '../types';

/**
 * Groups Cambridge Dictionary pronunciations by part of speech, pairing up
 * the UK/US entry for each group.
 */
export const groupPronunciationsByPos = (
  pronunciations: CambridgePronunciation[],
): GroupedPronunciation[] => {
  const groups = pronunciations.reduce(
    (acc, pron) => {
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
    },
    {} as Record<
      string,
      {
        uk: CambridgePronunciation | null;
        us: CambridgePronunciation | null;
      }
    >,
  );

  return Object.entries(groups).map(([pos, group]) => ({
    pos,
    uk: group.uk,
    us: group.us,
  }));
};

/**
 * Builds the human-readable success message shown after applying a
 * pronunciation lookup result to the word form.
 */
export const formatPronunciationSuccessMessage = (
  ukUrl: string,
  usUrl: string,
  pos?: string,
): string => {
  const appliedUrls: string[] = [];
  if (ukUrl) {
    appliedUrls.push('UK');
  }
  if (usUrl) {
    appliedUrls.push('US');
  }

  if (appliedUrls.length === 0) {
    return 'Pronunciation data applied successfully!';
  }

  const urlText = appliedUrls.join(' and ');
  let successText = `${urlText} pronunciation URL${appliedUrls.length > 1 ? 's' : ''}`;
  if (pos && pos !== 'general') {
    successText += ` (${pos})`;
  }
  successText += ' applied successfully!';
  return successText;
};

/**
 * Builds the human-readable success message shown after applying a
 * dictionary definition lookup result to the word form.
 */
export const formatDefinitionSuccessMessage = (
  definition: CambridgeDefinition,
  exampleCount: number,
): string => {
  const itemsApplied: string[] = [];
  if (definition.pos) {
    itemsApplied.push('part of speech');
  }
  itemsApplied.push('definition');
  if (exampleCount > 0) {
    itemsApplied.push(`${exampleCount} example${exampleCount > 1 ? 's' : ''}`);
  }

  return `Applied ${itemsApplied.join(', ')} successfully!`;
};
