/**
 * Component prop type definitions and standards
 *
 * This file defines standard prop interfaces and patterns for React components,
 * promoting consistency and type safety across the application.
 */

import { ReactNode, CSSProperties } from 'react';

import {
  BaseEntity,
  ModalSize,
  ButtonVariant,
  EventHandler,
  AsyncEventHandler,
} from './base';

// ===== BASE COMPONENT PROPS =====

/**
 * Base props that all components should potentially accept
 */
export interface BaseComponentProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly testId?: string;
}

// ===== MODAL COMPONENT PROPS =====

/**
 * Base modal component props
 */
export interface BaseModalProps extends BaseComponentProps {
  readonly isOpen: boolean;
  readonly onClose: EventHandler;
  readonly title?: string;
  readonly size?: ModalSize;
  readonly disableBackdropClose?: boolean;
  readonly disableEscapeClose?: boolean;
}

// ===== FORM COMPONENT PROPS =====

/**
 * Select option interface
 */
export interface SelectOption<TValue = string> {
  readonly value: TValue;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
}

// ===== LIST COMPONENT PROPS =====

/**
 * Card action interface
 */
export interface CardAction<TEntity extends BaseEntity> {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly onClick: (entity: TEntity) => void;
  readonly disabled?: boolean | ((entity: TEntity) => boolean);
  readonly hidden?: boolean | ((entity: TEntity) => boolean);
  readonly variant?: ButtonVariant;
}

// ===== TEMPLATE BUTTON PROPS =====

/**
 * A quick-insert template button: `label` is the button text, `value` is the
 * markdown snippet inserted (or field value set) when clicked.
 */
export interface TemplateButton {
  readonly label: string;
  readonly value: string;
}

// ===== ENTITY REVIEW TAB PROPS =====

/**
 * Entity review tab configuration
 */
export interface EntityReviewConfig {
  readonly title: string;
  readonly entityName: string;
  readonly entityNamePlural: string;
  readonly enableSearch?: boolean;
  readonly enableQuiz?: boolean;
  readonly searchPlaceholder?: string;
  readonly emptyStateConfig?: EmptyStateConfig;
}

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly action?: EmptyStateAction;
}

/**
 * Empty state action
 */
export interface EmptyStateAction {
  readonly label: string;
  readonly onClick: EventHandler;
}

/**
 * Entity review tab actions
 */
export interface EntityReviewActions {
  readonly onNew?: EventHandler;
  readonly onQuizSetup?: EventHandler;
  readonly onSearch?: (term: string) => void;
  readonly onRefresh?: AsyncEventHandler;
}
