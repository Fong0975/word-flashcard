import { useCallback, useEffect, useReducer, useRef } from 'react';

import { MarkdownFormatResult } from './markdownFormatting';
import {
  createInitialHistory,
  markdownHistoryReducer,
} from './markdownHistory';

interface UseMarkdownHistoryResult {
  canUndo: boolean;
  canRedo: boolean;
  /** Records a keystroke-driven change; may merge into the current typing step. */
  recordTyping: (entry: MarkdownFormatResult, composing: boolean) => void;
  /** Records a change that is always its own undo step (toolbar actions, insertions). */
  recordStep: (entry: MarkdownFormatResult) => void;
  /**
   * Marks the next externally-applied value change as an undoable step.
   * Call right before asking the owner of `value` to change it on the
   * editor's behalf (e.g. appending a template).
   */
  expectExternalStep: () => void;
  /** Steps back and returns the entry to restore, or null when there is nothing to undo. */
  undo: () => MarkdownFormatResult | null;
  /** Steps forward and returns the entry to restore, or null when there is nothing to redo. */
  redo: () => MarkdownFormatResult | null;
}

/**
 * Undo/redo history for a controlled markdown editor, scoped to the lifetime
 * of the component using it.
 *
 * Changes the editor makes itself must be recorded *before* they are passed
 * to `onChange`. Any other change to `value` (e.g. a form populating its
 * initial content after mount) is treated as a new baseline and clears the
 * history, so it can never be undone back to a state the user did not create.
 *
 * @param value The editor's current controlled value.
 */
export const useMarkdownHistory = (value: string): UseMarkdownHistoryResult => {
  const [state, dispatch] = useReducer(
    markdownHistoryReducer,
    value,
    createInitialHistory,
  );
  const expectsExternalStepRef = useRef(false);

  useEffect(() => {
    dispatch({
      type: 'sync',
      value,
      asStep: expectsExternalStepRef.current,
    });
    expectsExternalStepRef.current = false;
  }, [value]);

  const recordTyping = useCallback(
    (entry: MarkdownFormatResult, composing: boolean) => {
      dispatch({
        type: 'record',
        entry,
        kind: 'typing',
        now: Date.now(),
        composing,
      });
    },
    [],
  );

  const recordStep = useCallback((entry: MarkdownFormatResult) => {
    dispatch({ type: 'record', entry, kind: 'discrete', now: Date.now() });
  }, []);

  const expectExternalStep = useCallback(() => {
    expectsExternalStepRef.current = true;
  }, []);

  const undo = (): MarkdownFormatResult | null => {
    const target = state.past[state.past.length - 1];
    if (!target) {
      return null;
    }
    dispatch({ type: 'undo' });
    return target;
  };

  const redo = (): MarkdownFormatResult | null => {
    const target = state.future[0];
    if (!target) {
      return null;
    }
    dispatch({ type: 'redo' });
    return target;
  };

  return {
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    recordTyping,
    recordStep,
    expectExternalStep,
    undo,
    redo,
  };
};
