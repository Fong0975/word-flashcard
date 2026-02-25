/**
 * Hook type definitions and constraints
 *
 * This file defines type constraints and interfaces for custom hooks,
 * ensuring consistency and proper typing across all hook implementations.
 */

import {
  BaseEntity,
  PaginationParams,
  PaginationInfo,
  SearchFilter,
  FormFieldValue,
  ValidationResult,
  ApiResponse,
  AsyncCallback,
  Callback,
} from './base';

// ===== ENTITY LIST HOOK TYPES =====

/**
 * Configuration for entity list hooks
 */
export interface EntityListConfig<TEntity extends BaseEntity> {
  readonly entityName: string;
  readonly itemsPerPage?: number;
  readonly autoFetch?: boolean;
  readonly enableSearch?: boolean;
  readonly apiService: EntityApiService<TEntity>;
  readonly searchConfig?: SearchConfig<TEntity>;
}

/**
 * API service interface for entity operations
 */
export interface EntityApiService<TEntity extends BaseEntity> {
  readonly fetchList: (params: EntityListParams) => Promise<EntityListResponse<TEntity>>;
  readonly getCount: (filter?: SearchFilter) => Promise<number>;
  readonly create?: (data: Partial<TEntity>) => Promise<TEntity>;
  readonly update?: (id: number, data: Partial<TEntity>) => Promise<TEntity>;
  readonly delete?: (id: number) => Promise<void>;
}

/**
 * Entity list parameters combining pagination and search
 */
export interface EntityListParams extends PaginationParams {
  readonly searchFilter?: SearchFilter;
}

/**
 * Entity list response structure
 */
export interface EntityListResponse<TEntity extends BaseEntity> {
  readonly data: readonly TEntity[];
  readonly pagination: PaginationInfo;
}

/**
 * Search configuration for entity list hooks
 */
export interface SearchConfig<TEntity extends BaseEntity> {
  readonly type: 'server' | 'client';
  readonly createSearchFilter?: (searchTerm: string) => SearchFilter;
  readonly filterPredicate?: (entity: TEntity, searchTerm: string) => boolean;
}

/**
 * Entity list hook state
 */
export interface EntityListState<TEntity extends BaseEntity> {
  readonly entities: readonly TEntity[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
  readonly itemsPerPage: number;
  readonly searchTerm: string;
  readonly totalCount: number;
}

/**
 * Entity list hook actions
 */
export interface EntityListActions<TEntity extends BaseEntity> {
  readonly fetchEntities: (page?: number) => Promise<void>;
  readonly nextPage: () => Promise<void>;
  readonly previousPage: () => Promise<void>;
  readonly goToPage: (page: number) => Promise<void>;
  readonly goToFirst: () => Promise<void>;
  readonly goToLast: () => Promise<void>;
  readonly refresh: () => Promise<void>;
  readonly clearError: () => void;
  readonly setSearchTerm: (term: string) => void;
}

/**
 * Complete entity list hook return type
 */
export interface EntityListHook<TEntity extends BaseEntity>
  extends EntityListState<TEntity>, EntityListActions<TEntity> {}

// ===== MODAL MANAGER HOOK TYPES =====

/**
 * Modal configuration with associated data
 */
export interface ModalConfig<TData = unknown> {
  readonly isOpen: boolean;
  readonly data?: TData;
}

/**
 * Modal manager state
 */
export interface ModalManagerState {
  readonly modalState: Record<string, ModalConfig>;
}

/**
 * Modal manager actions
 */
export interface ModalManagerActions {
  readonly openModal: <TData = unknown>(modalName: string, data?: TData) => void;
  readonly closeModal: (modalName: string) => void;
  readonly closeAllModals: () => void;
  readonly isModalOpen: (modalName: string) => boolean;
  readonly getModalData: <TData = unknown>(modalName: string) => TData | undefined;
  readonly setModalData: <TData = unknown>(modalName: string, data: TData) => void;
}

/**
 * Complete modal manager hook return type
 */
export interface ModalManagerHook extends ModalManagerState, ModalManagerActions {}

// ===== FORM MANAGER HOOK TYPES =====

/**
 * Form data constraint
 */
export interface FormData {
  readonly [key: string]: FormFieldValue;
}

/**
 * Form validation rule
 */
export interface ValidationRule<TValue = FormFieldValue> {
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly custom?: (value: TValue, formData: FormData) => string | null;
}

/**
 * Form validation rules
 */
export interface ValidationRules {
  readonly [fieldName: string]: ValidationRule;
}

/**
 * Form manager configuration
 */
export interface FormManagerConfig<TFormData extends FormData> {
  readonly initialValues: TFormData;
  readonly validationRules?: ValidationRules;
  readonly resetOnSuccess?: boolean;
  readonly validateOnChange?: boolean;
  readonly validateOnBlur?: boolean;
}

/**
 * Form submission options
 */
export interface FormSubmissionOptions {
  readonly skipValidation?: boolean;
  readonly resetOnSuccess?: boolean;
}

/**
 * Form manager state
 */
export interface FormManagerState<TFormData extends FormData> {
  readonly formData: TFormData;
  readonly errors: Record<string, string>;
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
  readonly submitError: string | null;
  readonly isDirty: boolean;
  readonly touchedFields: Set<keyof TFormData>;
}

/**
 * Form manager actions
 */
export interface FormManagerActions<TFormData extends FormData> {
  readonly updateField: (fieldName: keyof TFormData, value: FormFieldValue) => void;
  readonly setFormData: (formData: TFormData) => void;
  readonly resetForm: (newInitialValues?: Partial<TFormData>) => void;
  readonly validateField: (fieldName: keyof TFormData) => string | null;
  readonly validateForm: () => boolean;
  readonly clearErrors: () => void;
  readonly handleSubmit: (
    submitFn: AsyncCallback<[TFormData], void>,
    options?: FormSubmissionOptions
  ) => Promise<boolean>;
  readonly setSubmitting: (submitting: boolean) => void;
  readonly setSubmitError: (error: string | null) => void;
  readonly markFieldTouched: (fieldName: keyof TFormData) => void;
}

/**
 * Complete form manager hook return type
 */
export interface FormManagerHook<TFormData extends FormData>
  extends FormManagerState<TFormData>, FormManagerActions<TFormData> {}

// ===== ERROR HANDLER HOOK TYPES =====

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * Error information interface
 */
export interface ErrorInfo {
  readonly type: ErrorType;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
  readonly retryable: boolean;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  readonly defaultRetryable?: boolean;
  readonly logErrors?: boolean;
  readonly autoClears?: Partial<Record<ErrorType, number>>;
}

/**
 * Error handler state
 */
export interface ErrorHandlerState {
  readonly error: ErrorInfo | null;
  readonly hasError: boolean;
  readonly retryAction: Callback | null;
}

/**
 * Error handler actions
 */
export interface ErrorHandlerActions {
  readonly setError: (error: Error | string | null, type?: ErrorType) => void;
  readonly clearError: () => void;
  readonly setRetryAction: (action: Callback | null) => void;
  readonly handleAsync: <TResult>(
    asyncFn: () => Promise<TResult>,
    errorType?: ErrorType
  ) => Promise<TResult | null>;
}

/**
 * Complete error handler hook return type
 */
export interface ErrorHandlerHook extends ErrorHandlerState, ErrorHandlerActions {}

// ===== ASYNC OPERATION HOOK TYPES =====

/**
 * Async operation state
 */
export interface AsyncOperationState<TData = unknown, TError = Error> {
  readonly data: TData | null;
  readonly loading: boolean;
  readonly error: TError | null;
  readonly called: boolean;
}

/**
 * Async operation options
 */
export interface AsyncOperationOptions<TData> {
  readonly onSuccess?: (data: TData) => void;
  readonly onError?: (error: Error) => void;
  readonly onComplete?: () => void;
}

/**
 * Async operation actions
 */
export interface AsyncOperationActions<TArgs extends unknown[], TData> {
  readonly execute: (...args: TArgs) => Promise<TData | null>;
  readonly reset: () => void;
}

/**
 * Complete async operation hook return type
 */
export interface AsyncOperationHook<TArgs extends unknown[], TData, TError = Error>
  extends AsyncOperationState<TData, TError>, AsyncOperationActions<TArgs, TData> {}

// ===== DEBOUNCE HOOK TYPES =====

/**
 * Debounce hook configuration
 */
export interface DebounceConfig {
  readonly delay: number;
  readonly immediate?: boolean;
}

/**
 * Debounce hook return type
 */
export interface DebounceHook<TArgs extends unknown[]> {
  readonly debouncedFn: (...args: TArgs) => void;
  readonly cancel: () => void;
  readonly flush: () => void;
  readonly pending: boolean;
}

// ===== LOCAL STORAGE HOOK TYPES =====

/**
 * Local storage hook configuration
 */
export interface LocalStorageConfig<TValue> {
  readonly key: string;
  readonly defaultValue: TValue;
  readonly serializer?: {
    readonly read: (value: string) => TValue;
    readonly write: (value: TValue) => string;
  };
}

/**
 * Local storage hook return type
 */
export interface LocalStorageHook<TValue> {
  readonly value: TValue;
  readonly setValue: (value: TValue | ((prev: TValue) => TValue)) => void;
  readonly removeValue: () => void;
}

// ===== TYPE GUARDS AND UTILITIES =====

/**
 * Type guard to check if hook result has error
 */
export const hasError = <THook extends { error: unknown }>(
  hookResult: THook
): hookResult is THook & { error: NonNullable<THook['error']> } => {
  return hookResult.error != null;
};

/**
 * Type guard to check if hook result is loading
 */
export const isLoading = <THook extends { loading: boolean }>(
  hookResult: THook
): hookResult is THook & { loading: true } => {
  return hookResult.loading === true;
};

/**
 * Type guard to check if async operation has data
 */
export const hasData = <TData>(
  operation: AsyncOperationState<TData>
): operation is AsyncOperationState<TData> & { data: NonNullable<TData> } => {
  return operation.data != null;
};