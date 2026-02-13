// API configuration from environment variables
export const API_CONFIG = {
  // Get base URL from environment variables
  // Note: React only exposes environment variables that start with REACT_APP_
  // For local development, we'll use localhost as default
  hostname: process.env.REACT_APP_API_HOSTNAME || 'localhost',
  port: process.env.REACT_APP_API_PORT || '8080',

  // Dictionary API configuration
  dictionaryHostname: process.env.REACT_APP_API_HOSTNAME_DICTIONARY || 'localhost',
  dictionaryPort: process.env.REACT_APP_API_PORT_DICTIONARY || '8081',

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
  words: '/words',
  wordsRandom: '/words/random',
  wordDefinition: (wordId: number) => `/words/definition/${wordId}`,
  updateDefinition: (definitionId: number) => `/words/definition/${definitionId}`,
  deleteDefinition: (definitionId: number) => `/words/definition/${definitionId}`,
} as const;

// Dictionary API endpoints
export const DICTIONARY_ENDPOINTS = {
  lookup: (word: string) => `/dictionary/en-tw/${encodeURIComponent(word)}`,
} as const;