/**
 * Enhanced API type definitions
 *
 * This file defines comprehensive type definitions for API interactions,
 * including entity models, request/response types, and service interfaces.
 */

import {
  BaseEntity,
  FamiliarityLevel,
  SearchFilter,
  PaginationParams,
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
  readonly reminder: string | null;
  readonly count_practise: number;
  readonly definitions: readonly WordDefinition[];
}

/**
 * Note card entity
 */
export interface Note extends BaseEntity {
  readonly title: string;
  readonly content: string | null;
  readonly sort_order: number;
  readonly updated_at: string | null;
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
  readonly reminder?: string;
  readonly increment_count_practise?: boolean;
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
  readonly practiced?: boolean;
}

// ===== SEARCH AND FILTER TYPES =====

/**
 * Words search parameters
 */
export interface WordsSearchParams extends PaginationParams {
  readonly searchFilter?: SearchFilter;
  readonly familiarity?: readonly FamiliarityLevel[];
  readonly hasDefinitions?: boolean;
  readonly sort?: string;
}

/**
 * Questions search parameters
 */
export interface QuestionsSearchParams extends PaginationParams {
  readonly searchFilter?: SearchFilter;
  readonly minPracticeCount?: number;
  readonly maxFailureRate?: number;
  readonly sort?: string;
}

/**
 * Create note request
 */
export interface CreateNoteRequest {
  readonly title: string;
  readonly content?: string;
  readonly sort_order?: number;
}

/**
 * Update note request
 */
export interface UpdateNoteRequest {
  readonly title?: string;
  readonly content?: string;
  readonly sort_order?: number;
}

/**
 * Notes list parameters
 */
export interface NotesListParams extends PaginationParams {
  readonly sort?: string;
}

/**
 * Notes search parameters
 */
export interface NotesSearchParams extends PaginationParams {
  readonly searchFilter?: SearchFilter;
  readonly sort?: string;
}

/**
 * Random words request used by the Word Quiz. Supply either
 * familiarityLevels (quota is split across levels using a weighted 7:5:3
 * ratio) or perCategoryCounts (exact quota per level).
 */
export interface WordsRandomRequest {
  readonly count: number;
  readonly familiarity_levels?: readonly FamiliarityLevel[];
  readonly per_category_counts?: Readonly<Record<FamiliarityLevel, number>>;
}

/**
 * Random questions request
 */
export interface QuestionsRandomRequest {
  readonly count: number;
  readonly exclude_recent_days?: number;
  readonly filter?: {
    readonly minPracticeCount?: number;
    readonly maxFailureRate?: number;
    readonly searchFilter?: SearchFilter;
  };
}

// ===== QUIZ TYPES =====

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
  readonly updatedStats: {
    readonly countPractise: number;
    readonly countFailurePractise: number;
  };
}

// ===== STATS TYPES =====

export interface WordFamiliarityDistribution {
  readonly red: number;
  readonly yellow: number;
  readonly green: number;
}

export interface PracticeCountBucket {
  readonly range: string;
  readonly count: number;
}

export interface WordStatsResponse {
  readonly familiarity_distribution: WordFamiliarityDistribution;
  readonly practice_count_distribution: readonly PracticeCountBucket[];
}

export interface AccuracyBucket {
  readonly range: string;
  readonly count: number;
}

export interface QuestionStatsResponse {
  readonly accuracy_distribution: readonly AccuracyBucket[];
}
