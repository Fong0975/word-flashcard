/**
 * Type definitions index
 *
 * This file serves as the central export point for all type definitions
 * in the application. Import types from this file rather than individual
 * type files to maintain consistency and enable easier refactoring.
 *
 * @example
 * ```typescript
 * import { Word, BaseEntity } from '@/types';
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
