import { useState, useEffect } from 'react';

interface UseQuizExitGuardOptions {
  /** Whether the guard should be armed (e.g. quiz in progress with a valid config) */
  isActive: boolean;
  /** Called to leave the quiz once the user confirms (or when back is pressed while inactive) */
  onExit: () => void;
}

interface UseQuizExitGuardReturn {
  showExitConfirm: boolean;
  handleBackButton: () => void;
  handleExitConfirm: () => void;
  handleExitCancel: () => void;
}

/**
 * Guards against accidentally losing quiz progress via the browser back
 * button or a tab close/refresh, showing a confirmation dialog instead.
 */
export const useQuizExitGuard = ({
  isActive,
  onExit,
}: UseQuizExitGuardOptions): UseQuizExitGuardReturn => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Intercept the browser back button by pushing a guard state into history,
  // then re-pushing it on every popstate so the user stays on the page.
  useEffect(() => {
    if (!isActive) {
      return;
    }

    window.history.pushState(null, '');

    const handlePopState = () => {
      window.history.pushState(null, '');
      setShowExitConfirm(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isActive]);

  // Show the browser's native dialog when the user tries to close or refresh the tab.
  useEffect(() => {
    if (!isActive) {
      return;
    }
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isActive]);

  const handleBackButton = () => {
    if (isActive) {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  };

  const handleExitConfirm = () => {
    setShowExitConfirm(false);
    onExit();
  };

  const handleExitCancel = () => {
    setShowExitConfirm(false);
  };

  return {
    showExitConfirm,
    handleBackButton,
    handleExitConfirm,
    handleExitCancel,
  };
};
