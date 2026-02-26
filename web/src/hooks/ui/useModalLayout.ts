/**
 * Hook for consistent modal layout management
 *
 * This hook provides standardized classes and structure helpers
 * for modal layouts with fixed headers and footers.
 */

import { useMemo } from 'react';

export interface ModalLayoutConfig {
  readonly hasFixedHeader?: boolean;
  readonly hasFixedFooter?: boolean;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly headerClassName?: string;
  readonly footerClassName?: string;
}

export interface ModalLayoutClasses {
  readonly container: string;
  readonly header: string;
  readonly content: string;
  readonly footer: string;
}

/**
 * Hook for modal layout management
 *
 * @example
 * const layout = useModalLayout({
 *   hasFixedHeader: true,
 *   hasFixedFooter: true,
 *   className: 'max-h-[95vh]'
 * });
 *
 * // Use layout.container, layout.header, layout.content, layout.footer
 * // in your modal JSX structure
 */
export const useModalLayout = (config: ModalLayoutConfig = {}): ModalLayoutClasses => {
  const {
    hasFixedHeader = false,
    hasFixedFooter = false,
    className = '',
    contentClassName = '',
    headerClassName = '',
    footerClassName = '',
  } = config;

  const layout = useMemo(() => {
    const baseContainer = 'flex flex-col';
    const baseHeader = hasFixedHeader ? 'flex-shrink-0' : '';
    const baseContent = hasFixedHeader || hasFixedFooter ? 'flex-1 min-h-0 overflow-y-auto' : '';
    const baseFooter = hasFixedFooter ? 'flex-shrink-0' : '';

    return {
      container: [baseContainer, className].filter(Boolean).join(' '),
      header: [baseHeader, headerClassName].filter(Boolean).join(' '),
      content: [baseContent, contentClassName].filter(Boolean).join(' '),
      footer: [baseFooter, footerClassName].filter(Boolean).join(' '),
    };
  }, [hasFixedHeader, hasFixedFooter, className, contentClassName, headerClassName, footerClassName]);

  return layout;
};

/**
 * Predefined layout configurations for common modal patterns
 */
export const ModalLayoutPresets = {
  /**
   * Standard modal with fixed header and footer
   */
  standard: {
    hasFixedHeader: true,
    hasFixedFooter: true,
    className: 'h-[90vh] -m-6 -mt-4',
    headerClassName: 'px-6 pt-6 pb-0',
    contentClassName: 'px-6 py-2',
    footerClassName: 'px-6 pt-0 pb-6',
  },

  /**
   * Simple modal with just content
   */
  simple: {
    hasFixedHeader: false,
    hasFixedFooter: false,
    className: '',
    contentClassName: 'space-y-4',
  },

  /**
   * Form modal with fixed footer for actions
   */
  form: {
    hasFixedHeader: false,
    hasFixedFooter: true,
    className: 'max-h-[90vh]',
    contentClassName: 'space-y-6 p-6 overflow-y-auto',
    footerClassName: 'px-6 py-4 border-t border-gray-200 dark:border-gray-700',
  },

  /**
   * Detail modal with fixed header and scrollable content
   */
  detail: {
    hasFixedHeader: true,
    hasFixedFooter: true,
    className: 'max-h-[95vh] overflow-hidden flex flex-col',
    headerClassName: 'flex-shrink-0 px-6 pt-6 pb-0 mb-2 border-b border-gray-200 dark:border-gray-700',
    contentClassName: 'flex-1 min-h-0 overflow-y-auto px-6 py-2',
    footerClassName: 'flex-shrink-0 px-6 pt-0 pb-6 border-t border-gray-200 dark:border-gray-700',
  },
} as const;