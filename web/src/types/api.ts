/**
 * Enhanced API type definitions
 *
 * This file defines comprehensive type definitions for API interactions,
 * including entity models, request/response types, and service interfaces.
 */

import {
  BaseEntity,
  TimestampedEntity,
  FamiliarityLevel,
  SearchFilter,
  PaginationParams,
  ApiResponse,
  ApiErrorResponse,
  ApiRequestOptions,
} from './base';

// ===== CORE ENTITY TYPES =====

/**
 * Word definition entity
 */
export interface WordDefinition extends BaseEntity {
  readonly definition: string;
  readonly examples: readonly string[];
  readonly notes: string;
  readonly part_of_speech: string;
  readonly phonetics: Record<string, unknown>;
}

/**
 * Word entity
 */
export interface Word extends BaseEntity {
  readonly word: string;
  readonly familiarity: FamiliarityLevel;
  readonly definitions: readonly WordDefinition[];
}

/**
 * Question entity
 */
export interface Question extends BaseEntity {
  readonly question: string;
  readonly answer: string;
  readonly option_a: string;
  readonly option_b?: string;
  readonly option_c?: string;
  readonly option_d?: string;
  readonly count_failure_practise: number;
  readonly count_practise: number;
  readonly notes: string;
  readonly reference: string;
}

/**
 * User entity (if needed for future features)
 */
export interface User extends TimestampedEntity {
  readonly username: string;
  readonly email: string;
  readonly preferences: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  readonly theme: 'light' | 'dark' | 'auto';
  readonly language: string;
  readonly itemsPerPage: number;
  readonly autoSave: boolean;
}

// ===== REQUEST TYPES =====

/**
 * Create word request
 */
export interface CreateWordRequest {
  readonly word: string;
  readonly familiarity?: FamiliarityLevel;
  readonly definitions?: readonly Partial<WordDefinition>[];
}

/**
 * Update word request
 */
export interface UpdateWordRequest {
  readonly word: string;
  readonly familiarity: FamiliarityLevel;
}

/**
 * Create word definition request
 */
export interface CreateWordDefinitionRequest {
  readonly definition: string;
  readonly examples?: readonly string[];
  readonly notes?: string;
  readonly part_of_speech?: string;
  readonly phonetics?: Record<string, unknown>;
}

/**
 * Update word definition request
 */
export interface UpdateWordDefinitionRequest {
  readonly definition: string;
  readonly examples: readonly string[];
  readonly notes: string;
  readonly part_of_speech: string;
  readonly phonetics: Record<string, unknown>;
}

/**
 * Create question request
 */
export interface CreateQuestionRequest {
  readonly question: string;
  readonly answer: string;
  readonly option_a: string;
  readonly option_b?: string;
  readonly option_c?: string;
  readonly option_d?: string;
  readonly notes?: string;
  readonly reference?: string;
}

/**
 * Update question request
 */
export interface UpdateQuestionRequest {
  readonly question: string;
  readonly answer: string;
  readonly option_a: string;
  readonly option_b?: string;
  readonly option_c?: string;
  readonly option_d?: string;
  readonly notes: string;
  readonly reference: string;
  readonly count_practise?: number;
  readonly count_failure_practise?: number;
}

// ===== RESPONSE TYPES =====

/**
 * Words list response
 */
export interface WordsResponse extends ApiResponse<readonly Word[]> {}

/**
 * Single word response
 */
export interface WordResponse extends ApiResponse<Word> {}

/**
 * Word definitions response
 */
export interface WordDefinitionsResponse extends ApiResponse<
  readonly WordDefinition[]
> {}

/**
 * Questions list response
 */
export interface QuestionsResponse extends ApiResponse<readonly Question[]> {}

/**
 * Single question response
 */
export interface QuestionResponse extends ApiResponse<Question> {}

/**
 * Count response for any entity
 */
export interface CountResponse extends ApiResponse<number> {}

// ===== SEARCH AND FILTER TYPES =====

/**
 * Words search parameters
 */
export interface WordsSearchParams extends PaginationParams {
  readonly searchFilter?: SearchFilter;
  readonly familiarity?: readonly FamiliarityLevel[];
  readonly hasDefinitions?: boolean;
}

/**
 * Questions search parameters
 */
export interface QuestionsSearchParams extends PaginationParams {
  readonly searchFilter?: SearchFilter;
  readonly minPracticeCount?: number;
  readonly maxFailureRate?: number;
}

/**
 * Random words filter
 */
export interface WordsRandomFilter extends SearchFilter {
  // Inherits conditions and logic from SearchFilter
}

/**
 * Random words request
 */
export interface WordsRandomRequest {
  readonly count: number;
  readonly filter?: WordsRandomFilter;
}

/**
 * Random questions request
 */
export interface QuestionsRandomRequest {
  readonly count: number;
  readonly filter?: {
    readonly minPracticeCount?: number;
    readonly maxFailureRate?: number;
    readonly searchFilter?: SearchFilter;
  };
}

// ===== QUIZ TYPES =====

/**
 * Base quiz configuration
 */
export interface BaseQuizConfig {
  readonly questionCount: number;
}

/**
 * Word quiz configuration
 */
export interface WordQuizConfig extends BaseQuizConfig {
  readonly selectedFamiliarity: readonly FamiliarityLevel[];
}

/**
 * Question quiz configuration
 */
export interface QuestionQuizConfig extends BaseQuizConfig {}

/**
 * Quiz result for a single word
 */
export interface WordQuizResult {
  readonly word: Word;
  readonly oldFamiliarity: FamiliarityLevel;
  readonly newFamiliarity: FamiliarityLevel;
}

/**
 * Quiz result for a single question
 */
export interface QuestionQuizResult {
  readonly question: Question;
  readonly userAnswer: string | null;
  readonly isCorrect: boolean;
}

/**
 * Complete quiz session result
 */
export interface QuizSessionResult<TResult> {
  readonly results: readonly TResult[];
  readonly score: number;
  readonly percentage: number;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly duration: number;
}

// ===== SERVICE INTERFACES =====

/**
 * Words API service interface
 */
export interface WordsApiService {
  // CRUD operations
  readonly getWord: (
    id: number,
    options?: ApiRequestOptions,
  ) => Promise<WordResponse>;
  readonly getWords: (
    params?: WordsSearchParams,
    options?: ApiRequestOptions,
  ) => Promise<WordsResponse>;
  readonly searchWords: (
    params: WordsSearchParams,
    options?: ApiRequestOptions,
  ) => Promise<WordsResponse>;
  readonly createWord: (
    data: CreateWordRequest,
    options?: ApiRequestOptions,
  ) => Promise<WordResponse>;
  readonly updateWord: (
    id: number,
    data: UpdateWordRequest,
    options?: ApiRequestOptions,
  ) => Promise<WordResponse>;
  readonly deleteWord: (
    id: number,
    options?: ApiRequestOptions,
  ) => Promise<void>;

  // Definition operations
  readonly getWordDefinitions: (
    wordId: number,
    options?: ApiRequestOptions,
  ) => Promise<WordDefinitionsResponse>;
  readonly createWordDefinition: (
    wordId: number,
    data: CreateWordDefinitionRequest,
    options?: ApiRequestOptions,
  ) => Promise<ApiResponse<WordDefinition>>;
  readonly updateWordDefinition: (
    wordId: number,
    definitionId: number,
    data: UpdateWordDefinitionRequest,
    options?: ApiRequestOptions,
  ) => Promise<ApiResponse<WordDefinition>>;
  readonly deleteWordDefinition: (
    wordId: number,
    definitionId: number,
    options?: ApiRequestOptions,
  ) => Promise<void>;

  // Utility operations
  readonly getWordsCount: (
    filter?: SearchFilter,
    options?: ApiRequestOptions,
  ) => Promise<CountResponse>;
  readonly getRandomWords: (
    request: WordsRandomRequest,
    options?: ApiRequestOptions,
  ) => Promise<WordsResponse>;
}

/**
 * Questions API service interface
 */
export interface QuestionsApiService {
  // CRUD operations
  readonly getQuestion: (
    id: number,
    options?: ApiRequestOptions,
  ) => Promise<QuestionResponse>;
  readonly getQuestions: (
    params?: QuestionsSearchParams,
    options?: ApiRequestOptions,
  ) => Promise<QuestionsResponse>;
  readonly searchQuestions: (
    params: QuestionsSearchParams,
    options?: ApiRequestOptions,
  ) => Promise<QuestionsResponse>;
  readonly createQuestion: (
    data: CreateQuestionRequest,
    options?: ApiRequestOptions,
  ) => Promise<QuestionResponse>;
  readonly updateQuestion: (
    id: number,
    data: UpdateQuestionRequest,
    options?: ApiRequestOptions,
  ) => Promise<QuestionResponse>;
  readonly deleteQuestion: (
    id: number,
    options?: ApiRequestOptions,
  ) => Promise<void>;

  // Utility operations
  readonly getQuestionsCount: (
    filter?: SearchFilter,
    options?: ApiRequestOptions,
  ) => Promise<CountResponse>;
  readonly getRandomQuestions: (
    request: QuestionsRandomRequest,
    options?: ApiRequestOptions,
  ) => Promise<QuestionsResponse>;
}

/**
 * Combined API service interface
 */
export interface ApiService extends WordsApiService, QuestionsApiService {
  // Health and meta operations
  readonly health: (options?: ApiRequestOptions) => Promise<{ status: string }>;
  readonly version: (
    options?: ApiRequestOptions,
  ) => Promise<{ version: string }>;
}

// ===== ERROR TYPES =====

/**
 * Specific API error types
 */
export interface ValidationError extends ApiErrorResponse {
  readonly code: 'VALIDATION_ERROR';
  readonly details: Record<string, readonly string[]>;
}

export interface NotFoundError extends ApiErrorResponse {
  readonly code: 'NOT_FOUND';
  readonly resource: string;
  readonly id: number | string;
}

export interface ConflictError extends ApiErrorResponse {
  readonly code: 'CONFLICT';
  readonly conflictingFields: readonly string[];
}

export interface RateLimitError extends ApiErrorResponse {
  readonly code: 'RATE_LIMIT_EXCEEDED';
  readonly retryAfter: number;
}

/**
 * Union type for all possible API errors
 */
export type ApiError =
  | ValidationError
  | NotFoundError
  | ConflictError
  | RateLimitError
  | ApiErrorResponse;

// ===== TYPE GUARDS =====

/**
 * Type guard for validation errors
 */
export const isValidationError = (error: unknown): error is ValidationError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Record<string, unknown>).code === 'VALIDATION_ERROR'
  );
};

/**
 * Type guard for not found errors
 */
export const isNotFoundError = (error: unknown): error is NotFoundError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Record<string, unknown>).code === 'NOT_FOUND'
  );
};

/**
 * Type guard for conflict errors
 */
export const isConflictError = (error: unknown): error is ConflictError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Record<string, unknown>).code === 'CONFLICT'
  );
};

/**
 * Type guard for rate limit errors
 */
export const isRateLimitError = (error: unknown): error is RateLimitError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Record<string, unknown>).code === 'RATE_LIMIT_EXCEEDED'
  );
};
