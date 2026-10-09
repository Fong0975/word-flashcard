import { act, renderHook } from '@testing-library/react';

import { MarkdownFormatResult } from './markdownFormatting';
import { TYPING_MERGE_WINDOW_MS } from './markdownHistory';
import { useMarkdownHistory } from './useMarkdownHistory';

const entry = (value: string): MarkdownFormatResult => ({
  value,
  selectionStart: value.length,
  selectionEnd: value.length,
});

/**
 * Drives the hook the way the editor does: a self-made change is recorded
 * first, then echoed back through the controlled `value`.
 */
const setup = (initialValue = '') => {
  const hook = renderHook(({ value }) => useMarkdownHistory(value), {
    initialProps: { value: initialValue },
  });

  const setValue = (value: string) => hook.rerender({ value });

  return {
    hook,
    step: (value: string) => {
      act(() => hook.result.current.recordStep(entry(value)));
      setValue(value);
    },
    type: (value: string, composing = false) => {
      act(() => hook.result.current.recordTyping(entry(value), composing));
      setValue(value);
    },
    undo: () => {
      let restored: MarkdownFormatResult | null = null;
      act(() => {
        restored = hook.result.current.undo();
      });
      if (restored) {
        setValue((restored as MarkdownFormatResult).value);
      }
      return restored as MarkdownFormatResult | null;
    },
    redo: () => {
      let restored: MarkdownFormatResult | null = null;
      act(() => {
        restored = hook.result.current.redo();
      });
      if (restored) {
        setValue((restored as MarkdownFormatResult).value);
      }
      return restored as MarkdownFormatResult | null;
    },
    external: (value: string) => setValue(value),
    expectExternalStep: () => hook.result.current.expectExternalStep(),
  };
};

type Harness = ReturnType<typeof setup>;

describe('useMarkdownHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const tests: {
    name: string;
    initialValue?: string;
    /** Returns the value of the last undo()/redo() call, when the case asserts on it. */
    run: (h: Harness) => MarkdownFormatResult | null | void;
    expected: {
      canUndo: boolean;
      canRedo: boolean;
      returned?: string | null;
    };
  }[] = [
    {
      name: 'has nothing to undo or redo initially',
      initialValue: 'existing',
      run: () => {},
      expected: { canUndo: false, canRedo: false },
    },
    {
      name: 'returns null from undo when there is nothing to undo',
      run: h => h.undo(),
      expected: { canUndo: false, canRedo: false, returned: null },
    },
    {
      name: 'returns null from redo when there is nothing to redo',
      run: h => h.redo(),
      expected: { canUndo: false, canRedo: false, returned: null },
    },
    {
      name: 'can undo after a recorded step',
      run: h => h.step('**a**'),
      expected: { canUndo: true, canRedo: false },
    },
    {
      name: 'returns the previous entry from undo and enables redo',
      initialValue: 'a',
      run: h => {
        h.step('**a**');
        return h.undo();
      },
      expected: { canUndo: false, canRedo: true, returned: 'a' },
    },
    {
      name: 'returns the undone entry from redo',
      initialValue: 'a',
      run: h => {
        h.step('**a**');
        h.undo();
        return h.redo();
      },
      expected: { canUndo: true, canRedo: false, returned: '**a**' },
    },
    {
      name: 'merges quick typing into one step',
      run: h => {
        h.type('a');
        vi.advanceTimersByTime(TYPING_MERGE_WINDOW_MS);
        h.type('ab');
        return h.undo();
      },
      expected: { canUndo: false, canRedo: true, returned: '' },
    },
    {
      name: 'splits typing into separate steps after a pause',
      run: h => {
        h.type('a');
        vi.advanceTimersByTime(TYPING_MERGE_WINDOW_MS + 1);
        h.type('ab');
        return h.undo();
      },
      expected: { canUndo: true, canRedo: true, returned: 'a' },
    },
    {
      name: 'keeps an IME composition in one step across a pause',
      run: h => {
        h.type('ㄋ', true);
        vi.advanceTimersByTime(TYPING_MERGE_WINDOW_MS * 10);
        h.type('你', true);
        return h.undo();
      },
      expected: { canUndo: false, canRedo: true, returned: '' },
    },
    {
      name: 'clears the history when the value changes externally',
      run: h => {
        h.step('a');
        h.step('ab');
        h.undo();
        h.external('loaded');
      },
      expected: { canUndo: false, canRedo: false },
    },
    {
      name: 'records an expected external change as an undoable step',
      initialValue: 'a',
      run: h => {
        h.expectExternalStep();
        h.external('a\n---');
        return h.undo();
      },
      expected: { canUndo: false, canRedo: true, returned: 'a' },
    },
    {
      name: 'only treats the next external change as expected',
      run: h => {
        h.expectExternalStep();
        h.external('---');
        h.external('loaded');
      },
      expected: { canUndo: false, canRedo: false },
    },
  ];

  it.each(tests)('$name', ({ initialValue, run, expected }) => {
    const harness = setup(initialValue);

    const returned = run(harness);

    expect(harness.hook.result.current.canUndo).toBe(expected.canUndo);
    expect(harness.hook.result.current.canRedo).toBe(expected.canRedo);
    if (expected.returned !== undefined) {
      expect(returned ? returned.value : returned).toBe(expected.returned);
    }
  });
});
