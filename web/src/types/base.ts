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
 * Form operation modes
 */
export enum FormMode {
  CREATE = 'create',
  EDIT = 'edit',
  VIEW = 'view',
}

/**
 * Loading states for async operations
 */
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
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

/**
 * Base interface for entities with timestamps
 */
export interface TimestampedEntity extends BaseEntity {
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Base interface for entities that can be archived/deleted
 */
export interface ArchivableEntity extends TimestampedEntity {
  readonly is_deleted: boolean;
  readonly deleted_at?: string;
}

// ===== UTILITY TYPES =====

/**
 * Make specified properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specified properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract keys of type T that have value type V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Extract string keys from an object type
 */
export type StringKeys<T> = KeysOfType<T, string>;

/**
 * Extract number keys from an object type
 */
export type NumberKeys<T> = KeysOfType<T, number>;

/**
 * Make all properties deeply optional
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Extract the value type from an array type
 */
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// ===== PAGINATION TYPES =====

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Enhanced pagination info with additional metadata
 */
export interface PaginationInfo {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
  readonly totalItems: number;
  readonly itemsPerPage: number;
  readonly startIndex: number;
  readonly endIndex: number;
}

// ===== API TYPES =====

/**
 * Generic API response wrapper
 */
export interface ApiResponse<TData = unknown> {
  readonly data: TData;
  readonly pagination?: PaginationInfo;
  readonly meta?: Record<string, unknown>;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  readonly error: string;
  readonly message?: string;
  readonly code?: string;
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

/**
 * Generic callback function type
 */
export type Callback<TArgs extends unknown[] = [], TReturn = void> = (...args: TArgs) => TReturn;

/**
 * Async callback function type
 */
export type AsyncCallback<TArgs extends unknown[] = [], TReturn = void> = (...args: TArgs) => Promise<TReturn>;

// ===== SEARCH TYPES =====

/**
 * Search condition for filtering entities
 */
export interface SearchCondition {
  readonly key: string;
  readonly operator: SearchOperation;
  readonly value: string;
}

/**
 * Search filter combining multiple conditions
 */
export interface SearchFilter {
  readonly conditions: readonly SearchCondition[];
  readonly logic: SearchLogic;
}

/**
 * Extended search parameters with pagination
 */
export interface SearchParams extends PaginationParams {
  readonly searchFilter?: SearchFilter;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

// ===== FORM TYPES =====

/**
 * Generic form field value
 */
export type FormFieldValue = string | number | boolean | string[] | null | undefined;

/**
 * Form validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: Record<string, string>;
}

/**
 * Form submission state
 */
export interface FormSubmissionState {
  readonly isSubmitting: boolean;
  readonly isSuccess: boolean;
  readonly error?: string;
}