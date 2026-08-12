// API configuration from environment variables
export const API_CONFIG = {
  // Get base URL from environment variables
  // Note: Vite only exposes environment variables that start with VITE_
  // For local development, we'll use localhost as default
  hostname: import.meta.env.VITE_API_HOSTNAME || 'localhost',
  port: import.meta.env.VITE_API_PORT || '8080',

  // Dictionary API configuration
  dictionaryHostname:
    import.meta.env.VITE_API_HOSTNAME_DICTIONARY || 'localhost',
  dictionaryPort: import.meta.env.VITE_API_PORT_DICTIONARY || '8081',

  // Construct base URL
  get baseURL() {
    return `http://${this.hostname}:${this.port}/api`;
  },

  // Construct dictionary base URL
  get dictionaryBaseURL() {
    return `http://${this.dictionaryHostname}:${this.dictionaryPort}/api`;
  },

  // Default request timeout
  timeout: 10000,

  // Default headers
  headers: {
    'Content-Type': 'application/json',
  },
};

// API endpoints
export const API_ENDPOINTS = {
  information: '/information',
  words: '/words',
  wordsSearch: '/words/search',
  wordsRandom: '/words/random',
  wordsCount: '/words/count',
  wordDefinition: (wordId: number) => `/words/definition/${wordId}`,
  updateDefinition: (definitionId: number) =>
    `/words/definition/${definitionId}`,
  deleteDefinition: (definitionId: number) =>
    `/words/definition/${definitionId}`,
  wordsStats: '/words/stats',
  wordsTrend: '/words/trend',
  wordLogs: (wordId: number) => `/words/${wordId}/logs`,
  questions: '/questions',
  questionById: (questionId: number) => `/questions/${questionId}`,
  questionsRandom: '/questions/random',
  questionsCount: '/questions/count',
  questionsStats: '/questions/stats',
  questionsTrend: '/questions/trend',
  questionLogs: (questionId: number) => `/questions/${questionId}/logs`,
  notes: '/notes',
  notesSearch: '/notes/search',
  noteById: (noteId: number) => `/notes/${noteId}`,
  notesCount: '/notes/count',
  dataExport: '/data/export',
  dataImport: '/data/import',
} as const;

// Dictionary API endpoints
export const DICTIONARY_ENDPOINTS = {
  lookup: (word: string) => `/dictionary/en-tw/${encodeURIComponent(word)}`,
} as const;
