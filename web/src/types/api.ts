// API Models based on Swagger documentation

export interface WordDefinition {
  id: number;
  definition: string;
  examples: string[];
  notes: string;
  part_of_speech: string;
  phonetics: Record<string, any>;
}

export interface Word {
  id: number;
  word: string;
  familiarity: string;
  definitions: WordDefinition[];
}

// Request type for creating a new word with optional fields
export interface CreateWordRequest {
  word: string;
  familiarity?: string;
  definitions?: WordDefinition[];
}

// Request type for updating a word with only editable fields
export interface UpdateWordRequest {
  word: string;
  familiarity: string;
}

export interface ErrorResponse {
  error: string;
}


// Pagination related types
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  totalItems?: number;
  itemsPerPage: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
}

// API Request options
export interface ApiRequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// Words API query parameters
export interface WordsQueryParams extends PaginationParams {
  limit?: number;
  offset?: number;
}

// Quiz/Random words API types
export interface WordsRandomFilter {
  key: 'familiarity';
  operator: 'eq' | 'neq' | 'in' | 'nin';
  value: string | string[];
}

export interface WordsRandomRequest {
  count: number;
  filter: WordsRandomFilter;
}

// Quiz related types
export interface QuizConfig {
  selectedFamiliarity: string[];
  questionCount: number;
}

export interface QuizResult {
  word: Word;
  oldFamiliarity: string;
  newFamiliarity: string;
}

