/**
 * Cambridge Dictionary API interfaces and types
 */

export interface CambridgePronunciation {
  pos: string;
  lang: 'uk' | 'us';
  url: string;
  pron: string;
}

export interface CambridgeExample {
  id: number;
  text: string;
  translation: string;
}

export interface CambridgeDefinition {
  id: number;
  pos: string;
  text: string;
  translation: string;
  example: CambridgeExample[];
}

export interface CambridgeApiResponse {
  word: string;
  pos: string[];
  verbs: Array<{
    id: number;
    type: string;
    text: string;
  }>;
  pronunciation: CambridgePronunciation[];
  definition: CambridgeDefinition[];
}

// Grouped pronunciation data for UI display
export interface GroupedPronunciation {
  pos: string;
  uk: CambridgePronunciation | null;
  us: CambridgePronunciation | null;
}
