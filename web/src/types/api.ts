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


// Search Filter types
export interface SearchFilter {
  key: string;
  operator: string;
  value: string;
}

export interface WordsSearchParams extends PaginationParams {
  searchFilter?: SearchFilter;
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

// Question related types based on Swagger documentation
export interface Question {
  id: number;
  question: string;
  answer: string;
  option_a: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  count_failure_practise: number;
  count_practise: number;
  notes: string;
  reference: string;
}

// Request type for creating a new question
export interface CreateQuestionRequest {
  question: string;
  answer: string;
  option_a: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  notes?: string;
  reference?: string;
}

// Request type for updating a question
export interface UpdateQuestionRequest {
  question: string;
  answer: string;
  option_a: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  notes: string;
  reference: string;
  count_practise?: number;
  count_failure_practise?: number;
}

// Questions search params
export interface QuestionsSearchParams extends PaginationParams {
  searchFilter?: SearchFilter;
}

// Questions random request
export interface QuestionsRandomRequest {
  count: number;
}

// Question Quiz configuration
export interface QuestionQuizConfig {
  questionCount: number;
}

// Question Quiz result for a single question
export interface QuestionQuizResult {
  question: Question;
  userAnswer: string | null; // The user's selected answer (A, B, C, D)
  isCorrect: boolean;
}

