/**
 * Component prop type definitions and standards
 *
 * This file defines standard prop interfaces and patterns for React components,
 * promoting consistency and type safety across the application.
 */

import { ReactNode, CSSProperties } from 'react';

import {
  BaseEntity,
  FormMode,
  ModalSize,
  ButtonVariant,
  EventHandler,
  AsyncEventHandler,
  AsyncCallback,
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

/**
 * Props for components that can be disabled
 */
export interface DisableableProps {
  readonly disabled?: boolean;
}

/**
 * Props for components that have loading states
 */
export interface LoadableProps {
  readonly loading?: boolean;
  readonly loadingText?: string;
}

/**
 * Props for components that can display errors
 */
export interface ErrorableProps {
  readonly error?: string | null;
  readonly onErrorDismiss?: EventHandler;
}

/**
 * Standard component props combining common patterns
 */
export interface StandardComponentProps
  extends BaseComponentProps, DisableableProps, LoadableProps, ErrorableProps {}

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

/**
 * Form modal props extending base modal props
 */
export interface FormModalProps<
  TEntity extends BaseEntity = BaseEntity,
> extends BaseModalProps {
  readonly mode: FormMode;
  readonly entity?: TEntity;
  readonly onSave?: AsyncCallback<[TEntity], void>;
  readonly onSaved?: AsyncCallback<[TEntity], void>;
}

// ===== FORM COMPONENT PROPS =====

/**
 * Base form field props
 */
export interface BaseFieldProps extends BaseComponentProps, DisableableProps {
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly helpText?: string;
  readonly error?: string;
}

/**
 * Input field props
 */
export interface InputFieldProps extends BaseFieldProps {
  readonly type?: 'text' | 'email' | 'password' | 'number' | 'url';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly maxLength?: number;
  readonly minLength?: number;
}

/**
 * Select field props
 */
export interface SelectFieldProps<TValue = string> extends BaseFieldProps {
  readonly value: TValue;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly SelectOption<TValue>[];
  readonly multiple?: boolean;
}

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

// ===== BUTTON COMPONENT PROPS =====

/**
 * Button component props
 */
export interface ButtonProps
  extends BaseComponentProps, DisableableProps, LoadableProps {
  readonly children: ReactNode;
  readonly variant?: ButtonVariant;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly fullWidth?: boolean;
  readonly onClick?: EventHandler;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly icon?: ReactNode;
  readonly iconPosition?: 'left' | 'right';
}

// ===== LIST COMPONENT PROPS =====

/**
 * Generic list component props
 */
export interface ListComponentProps<
  TItem extends BaseEntity,
> extends BaseComponentProps {
  readonly items: readonly TItem[];
  readonly renderItem: (item: TItem, index: number) => ReactNode;
  readonly onItemClick?: (item: TItem, index: number) => void;
  readonly emptyState?: ReactNode;
  readonly loading?: boolean;
  readonly error?: string;
}

/**
 * Entity card component props
 */
export interface EntityCardProps<
  TEntity extends BaseEntity,
> extends BaseComponentProps {
  readonly entity: TEntity;
  readonly index?: number;
  readonly onClick?: (entity: TEntity) => void;
  readonly selected?: boolean;
  readonly actions?: readonly CardAction<TEntity>[];
}

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

// ===== PAGINATION COMPONENT PROPS =====

/**
 * Pagination component props
 */
export interface PaginationProps extends BaseComponentProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
  readonly onNext?: EventHandler;
  readonly onPrevious?: EventHandler;
  readonly onGoToPage?: (page: number) => void;
  readonly onGoToFirst?: EventHandler;
  readonly onGoToLast?: EventHandler;
  readonly showFirstLast?: boolean;
  readonly showPageNumbers?: boolean;
  readonly maxPageNumbers?: number;
}

// ===== SEARCH COMPONENT PROPS =====

/**
 * Search input component props
 */
export interface SearchInputProps extends BaseComponentProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly debounceMs?: number;
  readonly onSearch?: (value: string) => void;
  readonly clearable?: boolean;
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

// ===== QUIZ COMPONENT PROPS =====

/**
 * Quiz setup configuration
 */
export interface QuizSetupConfig {
  readonly title: string;
  readonly entityName: string;
  readonly enableFamiliaritySelection?: boolean;
  readonly defaultQuestionCount?: number;
  readonly maxQuestionCount?: number;
}

/**
 * Quiz configuration result
 */
export interface QuizConfiguration {
  readonly questionCount: number;
  readonly selectedFamiliarity?: readonly string[];
}

/**
 * Quiz setup modal props
 */
export interface QuizSetupModalProps extends BaseModalProps {
  readonly config: QuizSetupConfig;
  readonly onStartQuiz: (config: QuizConfiguration) => void;
}

// ===== HIGHER-ORDER COMPONENT TYPES =====

/**
 * HOC props injection pattern
 */
export type WithProps<TInjectedProps, TOwnProps = {}> = (
  WrappedComponent: React.ComponentType<TInjectedProps & TOwnProps>,
) => React.ComponentType<TOwnProps>;

/**
 * Component with children
 */
export interface ComponentWithChildren {
  readonly children: ReactNode;
}

/**
 * Generic component ref type
 */
export type ComponentRef<TComponent> =
  TComponent extends React.ComponentType<infer P> ? React.Ref<P> : never;

// ===== TYPE GUARDS =====

/**
 * Type guard for checking if a component has certain props
 */
export const hasProps = <TProps extends Record<string, unknown>>(
  component: unknown,
  propNames: readonly (keyof TProps)[],
): component is TProps => {
  return (
    component !== null &&
    typeof component === 'object' &&
    propNames.every(prop => prop in component)
  );
};
