import { MarkdownFormatResult } from './markdownFormatting';

export const MAX_HISTORY_STEPS = 50;
export const TYPING_MERGE_WINDOW_MS = 500;

export interface MarkdownHistoryState {
  /** Oldest first; capped at `MAX_HISTORY_STEPS`. */
  past: MarkdownFormatResult[];
  present: MarkdownFormatResult;
  /** Next redo target first. */
  future: MarkdownFormatResult[];
  /** Timestamp of the last typing change, or null when `present` is not an open typing step. */
  lastTypingAt: number | null;
}

export type MarkdownHistoryAction =
  | {
      type: 'record';
      entry: MarkdownFormatResult;
      /** 'typing' changes may merge into the previous typing step; 'discrete' ones never do. */
      kind: 'typing' | 'discrete';
      now: number;
      /** True while an IME composition is in progress. */
      composing?: boolean;
    }
  | { type: 'undo' }
  | { type: 'redo' }
  | {
      type: 'sync';
      value: string;
      /** Whether a value that differs from `present` is an undoable step rather than a new baseline. */
      asStep: boolean;
    };

export type MarkdownHistoryShortcut = 'undo' | 'redo';

interface ShortcutKeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

const entryAtEnd = (value: string): MarkdownFormatResult => ({
  value,
  selectionStart: value.length,
  selectionEnd: value.length,
});

export const createInitialHistory = (value: string): MarkdownHistoryState => ({
  past: [],
  present: entryAtEnd(value),
  future: [],
  lastTypingAt: null,
});

const pushStep = (
  state: MarkdownHistoryState,
  entry: MarkdownFormatResult,
  lastTypingAt: number | null,
): MarkdownHistoryState => ({
  past: [...state.past, state.present].slice(-MAX_HISTORY_STEPS),
  present: entry,
  future: [],
  lastTypingAt,
});

/**
 * Pure undo/redo history for the markdown editor.
 *
 * Consecutive typing changes collapse into a single step while they arrive
 * within `TYPING_MERGE_WINDOW_MS` of each other, or for as long as an IME
 * composition is in progress (candidate selection can take far longer than
 * the merge window and must not be split into several steps).
 */
export const markdownHistoryReducer = (
  state: MarkdownHistoryState,
  action: MarkdownHistoryAction,
): MarkdownHistoryState => {
  switch (action.type) {
    case 'record': {
      if (action.entry.value === state.present.value) {
        return state;
      }
      if (action.kind === 'discrete') {
        return pushStep(state, action.entry, null);
      }

      const continuesTypingStep =
        state.lastTypingAt !== null &&
        (action.composing === true ||
          action.now - state.lastTypingAt <= TYPING_MERGE_WINDOW_MS);
      if (continuesTypingStep) {
        return {
          ...state,
          present: action.entry,
          future: [],
          lastTypingAt: action.now,
        };
      }
      return pushStep(state, action.entry, action.now);
    }

    case 'undo': {
      if (state.past.length === 0) {
        return state;
      }
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
        lastTypingAt: null,
      };
    }

    case 'redo': {
      if (state.future.length === 0) {
        return state;
      }
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
        lastTypingAt: null,
      };
    }

    case 'sync': {
      if (action.value === state.present.value) {
        return state;
      }
      return action.asStep
        ? pushStep(state, entryAtEnd(action.value), null)
        : createInitialHistory(action.value);
    }
  }
};

/**
 * Maps a keydown to the history action it requests: Ctrl/Cmd+Z undoes,
 * Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y redo. Returns null for anything else.
 */
export const getHistoryShortcut = ({
  key,
  ctrlKey,
  metaKey,
  shiftKey,
  altKey,
}: ShortcutKeyEvent): MarkdownHistoryShortcut | null => {
  if (altKey || !(ctrlKey || metaKey)) {
    return null;
  }

  switch (key.toLowerCase()) {
    case 'z':
      return shiftKey ? 'redo' : 'undo';
    case 'y':
      return shiftKey ? null : 'redo';
    default:
      return null;
  }
};
