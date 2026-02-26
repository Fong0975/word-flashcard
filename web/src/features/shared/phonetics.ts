/**
 * Extract pronunciation URLs from phonetics object
 */
export interface PronunciationUrls {
  uk?: string;
  us?: string;
}

/**
 * Extract UK and US pronunciation URLs from phonetics data
 * @param phonetics - The phonetics object from the word definition
 * @returns Object containing UK and US URLs if they exist
 */
export const extractPronunciationUrls = (phonetics?: Record<string, unknown>): PronunciationUrls => {
  if (!phonetics || typeof phonetics !== 'object') {
    return {};
  }

  const result: PronunciationUrls = {};

  // Common keys for UK pronunciation
  const ukKeys = ['uk', 'UK', 'british', 'British', 'gb', 'GB', 'en-GB', 'en_GB'];
  // Common keys for US pronunciation
  const usKeys = ['us', 'US', 'american', 'American', 'usa', 'USA', 'en-US', 'en_US'];

  // Helper function to extract URL from various data structures
  const extractUrl = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
      // Direct URL string
      if (value.startsWith('http') || value.startsWith('//') || value.endsWith('.mp3') || value.endsWith('.wav')) {
        return value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Object with possible audio/url properties
      const possibleKeys = ['audio', 'url', 'audioUrl', 'audioFile', 'sound', 'src', 'href'];
      const valueAsRecord = value as Record<string, unknown>;
      for (const key of possibleKeys) {
        if (valueAsRecord[key] && typeof valueAsRecord[key] === 'string') {
          return valueAsRecord[key] as string;
        }
      }
    }
    return undefined;
  };

  // Search for UK pronunciation
  for (const key of ukKeys) {
    if (phonetics[key]) {
      const url = extractUrl(phonetics[key]);
      if (url) {
        result.uk = url;
        break;
      }
    }
  }

  // Search for US pronunciation
  for (const key of usKeys) {
    if (phonetics[key]) {
      const url = extractUrl(phonetics[key]);
      if (url) {
        result.us = url;
        break;
      }
    }
  }

  // If we didn't find specific UK/US keys, try to infer from other patterns
  if (!result.uk && !result.us) {
    Object.entries(phonetics).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      const url = extractUrl(value);

      if (url) {
        // Try to infer accent from key names or URL patterns
        if (lowerKey.includes('uk') || lowerKey.includes('british') || lowerKey.includes('gb') || url.includes('/uk/') || url.includes('/gb/')) {
          result.uk = url;
        } else if (lowerKey.includes('us') || lowerKey.includes('american') || lowerKey.includes('usa') || url.includes('/us/') || url.includes('/usa/')) {
          result.us = url;
        } else if (!result.uk && !result.us) {
          // If we can't determine the accent, default to UK for the first one found
          result.uk = url;
        }
      }
    });
  }

  return result;
};

/**
 * Check if a URL is a valid audio URL
 * @param url - The URL to check
 * @returns boolean indicating if the URL appears to be a valid audio URL
 */
export const isValidAudioUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check if it's a proper URL
  const isUrl = url.startsWith('http') || url.startsWith('//') || url.startsWith('/');

  // Check for common audio file extensions
  const hasAudioExtension = /\.(mp3|wav|ogg|m4a|aac|webm)(\?|$)/i.test(url);

  // Check for audio-related path patterns
  const hasAudioPattern = /\/(audio|sound|pronunciation|phonetic)/i.test(url);

  return isUrl && (hasAudioExtension || hasAudioPattern || url.length > 10);
};