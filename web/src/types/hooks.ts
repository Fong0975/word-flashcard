/**
 * Hook type definitions and constraints
 *
 * This file defines the shared shape for entity list hooks (e.g. useWords,
 * useQuestions, useNotes), ensuring consistency across list-based data hooks.
 */

import { BaseEntity } from './base';

// ===== ENTITY LIST HOOK TYPES =====

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
