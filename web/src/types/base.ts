/**
 * Core base types for the application
 *
 * This file contains fundamental type definitions that are used across
 * the entire application, including enums, utility types, and base interfaces.
 */

// ===== CORE ENUMS =====

/**
 * Familiarity levels for words and learning progress
 */
export enum FamiliarityLevel {
  RED = 'red',
  YELLOW = 'yellow',
  GREEN = 'green',
}

/**
 * Modal sizes
 */
export enum ModalSize {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
}

/**
 * Button variants
 */
export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
  SUCCESS = 'success',
  WARNING = 'warning',
  GHOST = 'ghost',
}

/**
 * Search operation types
 */
export enum SearchOperation {
  LIKE = 'like',
  EQUALS = 'equals',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
}

/**
 * Logical operators for search conditions
 */
export enum SearchLogic {
  AND = 'AND',
  OR = 'OR',
}

// ===== BASE INTERFACES =====

/**
 * Base entity interface - all entities should extend this
 */
export interface BaseEntity {
  readonly id: number;
}

// ===== PAGINATION TYPES =====

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  readonly limit?: number;
  readonly offset?: number;
}

// ===== API TYPES =====

/**
 * Machine-readable error categories returned by the backend, mirroring
 * `models.ErrorCode` in the Go API. Lets the UI branch on failure type
 * without depending on the (human-readable) message text.
 */
export type ApiErrorCode =
  | 'invalid_request'
  | 'validation_error'
  | 'not_found'
  | 'conflict'
  | 'internal_error'
  | 'upstream_unavailable';

/**
 * API error response
 */
export interface ApiErrorResponse {
  readonly error: string;
  readonly message?: string;
  readonly code?: ApiErrorCode;
  readonly details?: Record<string, unknown>;
}

/**
 * Generic API request options
 */
export interface ApiRequestOptions {
  readonly timeout?: number;
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
  readonly retries?: number;
}

// ===== EVENT HANDLING TYPES =====

/**
 * Standard event handler type
 */
export type EventHandler<T = void> = (event?: Event) => T;

/**
 * Async event handler type
 */
export type AsyncEventHandler<T = void> = (event?: Event) => Promise<T>;

// ===== SEARCH TYPES =====

/**
 * Search condition for filtering entities
 */
export interface SearchCondition {
  readonly key: string;
  readonly operator: SearchOperation;
  readonly value?: string;
}

/**
 * Search filter combining multiple conditions
 */
export interface SearchFilter {
  readonly conditions: readonly SearchCondition[];
  readonly logic: SearchLogic;
}
