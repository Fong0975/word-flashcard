import { useEffect, useRef, useState } from 'react';

// Each guard entry carries the id of the hook instance that pushed it, so a
// deferred pop never removes an entry that belongs to another guard.
let nextGuardId = 0;

const createGuardState = (guardId: number) => ({
  unsavedChangesGuard: true,
  guardId,
});

const isOnGuardEntry = (guardId?: number): boolean =>
  window.history.state?.unsavedChangesGuard === true &&
  (guardId === undefined || window.history.state?.guardId === guardId);

interface UseUnsavedChangesGuardOptions {
  /**
   * Whether the page is currently editable. The browser-back guard stays
   * installed for as long as this is true, regardless of `isDirty`.
   */
  isEditing: boolean;
  /** Whether there are unsaved edits that leaving would discard */
  isDirty: boolean;
  /**
   * Called to actually leave, either immediately (clean) or once the user
   * confirms. When it navigates while `isEditing`, it should replace the
   * current history entry so the guard entry is not left behind.
   */
  onLeave: () => void;
}

interface UseUnsavedChangesGuardReturn {
  showConfirm: boolean;
  requestLeave: () => void;
  confirmLeave: () => void;
  cancelLeave: () => void;
}

/**
 * Guards against losing unsaved edits when leaving a page or closing a modal
 * through an in-app control, the browser back button, or a tab close/refresh.
 * Leaving goes through a confirmation while dirty and happens immediately
 * otherwise.
 *
 * @param options.isEditing - Whether the page/modal is editable and should be guarded
 * @param options.isDirty - Whether leaving would discard unsaved edits
 * @param options.onLeave - Leaves the page or closes the modal
 * @returns Confirmation visibility plus the request/confirm/cancel handlers
 */
export const useUnsavedChangesGuard = ({
  isEditing,
  isDirty,
  onLeave,
}: UseUnsavedChangesGuardOptions): UseUnsavedChangesGuardReturn => {
  const [showConfirm, setShowConfirm] = useState(false);
  // Set once a clean browser-back has been let through; the follow-up
  // popstate of that same navigation must not be handled again.
  const isPassingThroughRef = useRef(false);
  // Timer of a guard-entry pop scheduled by the guard effect's cleanup.
  const pendingGuardPopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guardIdRef = useRef<number>(0);
  if (guardIdRef.current === 0) {
    nextGuardId += 1;
    guardIdRef.current = nextGuardId;
  }

  // Declared before the guard-entry effect so this listener is already
  // detached when that effect's cleanup pops the guard entry.
  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const handlePopState = () => {
      // Landing on a guard entry means the page was not left (e.g. a stale
      // guard entry from an earlier mount), so there is nothing to protect.
      if (isPassingThroughRef.current || isOnGuardEntry()) {
        return;
      }

      if (isDirty) {
        window.history.pushState(createGuardState(guardIdRef.current), '');
        setShowConfirm(true);
      } else {
        isPassingThroughRef.current = true;
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isEditing, isDirty]);

  // A router without data-router support cannot block navigation, so the
  // browser back button is intercepted with an extra history entry instead.
  // It is keyed on isEditing rather than isDirty so that toggling between
  // clean and dirty does not stack up one entry per toggle.
  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const guardId = guardIdRef.current;

    if (pendingGuardPopRef.current !== null) {
      // Re-run straight after this effect's own cleanup (React StrictMode
      // remounts on mount in development): the guard entry pushed by the
      // first run is still current, so keep it instead of popping it. An
      // immediate pop would land on the page's own entry and be mistaken
      // for a clean browser-back, leaving the page.
      clearTimeout(pendingGuardPopRef.current);
      pendingGuardPopRef.current = null;
    } else {
      isPassingThroughRef.current = false;
      window.history.pushState(createGuardState(guardId), '');
    }

    return () => {
      // Still on the guard entry means editing ended without navigating
      // away (e.g. a modal closed, or edit mode was cancelled), so drop the
      // entry instead of leaving a dead back press behind. An onLeave that
      // navigates should replace the current entry to the same effect.
      // Deferred so that an immediate re-run of the effect can cancel it;
      // checked against this guard's own entry since, by then, another
      // guard may have pushed one.
      pendingGuardPopRef.current = setTimeout(() => {
        pendingGuardPopRef.current = null;
        if (isOnGuardEntry(guardId)) {
          window.history.back();
        }
      }, 0);
    };
  }, [isEditing]);

  // Show the browser's native dialog when the user tries to close or refresh the tab.
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const requestLeave = () => {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      onLeave();
    }
  };

  const confirmLeave = () => {
    setShowConfirm(false);
    onLeave();
  };

  const cancelLeave = () => {
    setShowConfirm(false);
  };

  return {
    showConfirm,
    requestLeave,
    confirmLeave,
    cancelLeave,
  };
};
