import { useEffect, useRef } from 'react';

// Global state for modal scroll management
let modalCount = 0;
let originalStyles: {
  body: {
    overflow: string;
    paddingRight: string;
  };
  documentElement: {
    overflow: string;
  };
} | null = null;

/**
 * Hook for managing scrollbar behavior across multiple modals
 *
 * This hook solves the nested modal scrollbar issue by using a global counter
 * to track how many modals are currently open. The scrollbar is only disabled
 * when the first modal opens and only restored when the last modal closes.
 *
 * @param isOpen - Whether the modal using this hook is currently open
 *
 * @example
 * ```tsx
 * const Modal = ({ isOpen, onClose }) => {
 *   useModalScrollManager(isOpen);
 *
 *   // rest of modal implementation...
 * };
 * ```
 */
export const useModalScrollManager = (isOpen: boolean) => {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    // Modal is opening
    if (isOpen && !wasOpen) {
      modalCount++;

      // First modal opening - save original styles and disable scrollbar
      if (modalCount === 1) {
        // Store original values
        originalStyles = {
          body: {
            overflow: document.body.style.overflow,
            paddingRight: document.body.style.paddingRight,
          },
          documentElement: {
            overflow: document.documentElement.style.overflow,
          },
        };

        // Calculate scrollbar width
        const scrollbarWidth =
          window.innerWidth - document.documentElement.clientWidth;

        // Prevent scrolling without changing scroll position
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        document.documentElement.style.overflow = 'hidden';
      }
    }

    // Modal is closing
    if (!isOpen && wasOpen) {
      modalCount = Math.max(0, modalCount - 1);

      // Last modal closing - restore original styles
      if (modalCount === 0 && originalStyles) {
        document.body.style.overflow = originalStyles.body.overflow;
        document.body.style.paddingRight = originalStyles.body.paddingRight;
        document.documentElement.style.overflow =
          originalStyles.documentElement.overflow;

        // Clear stored styles
        originalStyles = null;
      }
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const wasOpen = wasOpenRef.current;
      if (wasOpen) {
        modalCount = Math.max(0, modalCount - 1);

        // If this was the last modal, restore styles
        if (modalCount === 0 && originalStyles) {
          document.body.style.overflow = originalStyles.body.overflow;
          document.body.style.paddingRight = originalStyles.body.paddingRight;
          document.documentElement.style.overflow =
            originalStyles.documentElement.overflow;
          originalStyles = null;
        }
      }
    };
  }, []);
};

/**
 * Development utility to check current modal count
 * Only available in development mode
 */
export const getModalCount = () => {
  if (process.env.NODE_ENV === 'development') {
    return modalCount;
  }
  return 0;
};
