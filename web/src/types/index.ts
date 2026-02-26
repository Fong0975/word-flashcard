/**
 * Type definitions index
 *
 * This file serves as the central export point for all type definitions
 * in the application. Import types from this file rather than individual
 * type files to maintain consistency and enable easier refactoring.
 *
 * @example
 * ```typescript
 * import { Word, WordQuizConfig, FormManagerHook } from '@/types';
 * ```
 */

// ===== BASE TYPES =====
export * from './base';

// ===== COMPONENT TYPES =====
export * from './components';

// ===== HOOK TYPES =====
export * from './hooks';

// ===== API TYPES =====
export * from './api';

// ===== RE-EXPORTS FOR BACKWARDS COMPATIBILITY =====

// Legacy exports that may be used in existing code
export type {
  Word,
  WordDefinition,
  Question,
  CreateWordRequest,
  UpdateWordRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  WordQuizConfig as QuizConfig, // Legacy alias
  QuestionQuizConfig,
  WordQuizResult as QuizResult, // Legacy alias
  QuestionQuizResult,
  ApiError,
} from './api';

export type {
  BaseEntity,
  FormMode,
  LoadingState,
  SearchFilter,
  SearchCondition,
  PaginationParams,
  PaginationInfo,
  ApiResponse,
} from './base';

// Export as both type and value
export { FamiliarityLevel } from './base';

export type {
  EntityListHook as UseEntityListReturn, // Legacy alias
  FormManagerHook as UseFormManagerReturn, // Legacy alias
  ModalManagerHook as UseModalManagerReturn, // Legacy alias
  ErrorHandlerHook as UseErrorHandlerReturn, // Legacy alias
} from './hooks';

// Import types needed for type utilities (not re-exported)
import type { EntityListHook, FormManagerHook } from './hooks';
import type { BaseEntity, ApiResponse } from './base';
import type { Word, Question, ApiError } from './api';

// Import values needed for runtime validation
import { FamiliarityLevel } from './base';

// ===== TYPE UTILITIES =====

/**
 * Extract the entity type from a list hook
 */
export type EntityFromListHook<T> = T extends EntityListHook<infer U> ? U : never;

/**
 * Extract the form data type from a form manager hook
 */
export type FormDataFromHook<T> = T extends FormManagerHook<infer U> ? U : never;

/**
 * Extract the data type from an API response
 */
export type DataFromResponse<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * Make API request type from entity type
 */
export type CreateRequestFromEntity<T extends BaseEntity> = Omit<T, 'id'>;
export type UpdateRequestFromEntity<T extends BaseEntity> = Partial<Omit<T, 'id'>>;

/**
 * Extract keys that can be used for search
 */
export type SearchableKeys<T> = {
  [K in keyof T]: T[K] extends string | number ? K : never;
}[keyof T];

/**
 * Common type patterns
 */
export type ID = number;
export type Timestamp = string;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// ===== GLOBAL TYPE AUGMENTATIONS =====

declare global {
  /**
   * Global type for environment variables
   */
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_API_TIMEOUT: string;
    readonly VITE_ENABLE_MOCK: string;
  }

  /**
   * Global type for CSS custom properties
   */
  interface CSSStyleDeclaration {
    '--primary-color': string;
    '--secondary-color': string;
    '--accent-color': string;
  }
}

// ===== TYPE VALIDATION HELPERS =====

/**
 * Runtime type checking utilities
 */
export const TypeValidation = {
  /**
   * Check if value is a valid entity (has id property)
   */
  isEntity: (value: unknown): value is BaseEntity => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof (value as any).id === 'number'
    );
  },

  /**
   * Check if value is a valid word entity
   */
  isWord: (value: unknown): value is Word => {
    return (
      TypeValidation.isEntity(value) &&
      'word' in value &&
      typeof (value as any).word === 'string' &&
      'familiarity' in value &&
      'definitions' in value &&
      Array.isArray((value as any).definitions)
    );
  },

  /**
   * Check if value is a valid question entity
   */
  isQuestion: (value: unknown): value is Question => {
    return (
      TypeValidation.isEntity(value) &&
      'question' in value &&
      typeof (value as any).question === 'string' &&
      'answer' in value &&
      typeof (value as any).answer === 'string' &&
      'option_a' in value &&
      typeof (value as any).option_a === 'string'
    );
  },

  /**
   * Check if value is a valid familiarity level
   */
  isFamiliarityLevel: (value: unknown): value is FamiliarityLevel => {
    return (
      typeof value === 'string' &&
      Object.values(FamiliarityLevel).includes(value as FamiliarityLevel)
    );
  },

  /**
   * Check if value is a valid API response
   */
  isApiResponse: <T>(value: unknown): value is ApiResponse<T> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'data' in value
    );
  },

  /**
   * Check if value is a valid API error
   */
  isApiError: (value: unknown): value is ApiError => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'error' in value &&
      typeof (value as any).error === 'string'
    );
  },
} as const;