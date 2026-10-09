import { MarkdownFormatResult } from './markdownFormatting';
import {
  MAX_HISTORY_STEPS,
  TYPING_MERGE_WINDOW_MS,
  MarkdownHistoryAction,
  MarkdownHistoryState,
  createInitialHistory,
  getHistoryShortcut,
  markdownHistoryReducer,
} from './markdownHistory';

const entry = (value: string): MarkdownFormatResult => ({
  value,
  selectionStart: value.length,
  selectionEnd: value.length,
});

const typing = (
  value: string,
  now: number,
  composing = false,
): MarkdownHistoryAction => ({
  type: 'record',
  entry: entry(value),
  kind: 'typing',
  now,
  composing,
});

const discrete = (value: string): MarkdownHistoryAction => ({
  type: 'record',
  entry: entry(value),
  kind: 'discrete',
  now: 0,
});

const run = (
  initial: MarkdownHistoryState,
  actions: MarkdownHistoryAction[],
): MarkdownHistoryState => actions.reduce(markdownHistoryReducer, initial);

const summarize = (state: MarkdownHistoryState) => ({
  past: state.past.map(e => e.value),
  present: state.present.value,
  future: state.future.map(e => e.value),
});

describe('createInitialHistory', () => {
  it.each([
    { name: 'an empty value', value: '', cursor: 0 },
    { name: 'existing content', value: 'hello', cursor: 5 },
  ])(
    'starts with no steps and the cursor at the end for $name',
    ({ value, cursor }) => {
      expect(createInitialHistory(value)).toEqual({
        past: [],
        present: { value, selectionStart: cursor, selectionEnd: cursor },
        future: [],
        lastTypingAt: null,
      });
    },
  );
});

describe('markdownHistoryReducer', () => {
  const tests: {
    name: string;
    initial?: string;
    actions: MarkdownHistoryAction[];
    expected: { past: string[]; present: string; future: string[] };
  }[] = [
    {
      name: 'starts a step for the first typing change',
      actions: [typing('a', 1000)],
      expected: { past: [''], present: 'a', future: [] },
    },
    {
      name: 'merges typing changes that arrive within the merge window',
      actions: [
        typing('a', 1000),
        typing('ab', 1000 + TYPING_MERGE_WINDOW_MS),
        typing('abc', 1000 + TYPING_MERGE_WINDOW_MS * 2),
      ],
      expected: { past: [''], present: 'abc', future: [] },
    },
    {
      name: 'starts a new step for typing after a pause',
      actions: [typing('a', 1000), typing('ab', 1001 + TYPING_MERGE_WINDOW_MS)],
      expected: { past: ['', 'a'], present: 'ab', future: [] },
    },
    {
      name: 'merges typing during an IME composition regardless of elapsed time',
      actions: [typing('ㄋ', 1000, true), typing('你', 60_000, true)],
      expected: { past: [''], present: '你', future: [] },
    },
    {
      name: 'does not merge a composition into a preceding discrete step',
      actions: [discrete('**'), typing('**ㄋ', 1000, true)],
      expected: { past: ['', '**'], present: '**ㄋ', future: [] },
    },
    {
      name: 'never merges discrete steps',
      actions: [discrete('a'), discrete('ab')],
      expected: { past: ['', 'a'], present: 'ab', future: [] },
    },
    {
      name: 'does not merge typing into a preceding discrete step',
      actions: [typing('a', 1000), discrete('**a**'), typing('**a**b', 1001)],
      expected: { past: ['', 'a', '**a**'], present: '**a**b', future: [] },
    },
    {
      name: 'ignores a record whose value is unchanged',
      initial: 'same',
      actions: [discrete('same'), typing('same', 1000)],
      expected: { past: [], present: 'same', future: [] },
    },
    {
      name: 'undoes to the previous step and keeps it available for redo',
      actions: [discrete('a'), discrete('ab'), { type: 'undo' }],
      expected: { past: [''], present: 'a', future: ['ab'] },
    },
    {
      name: 'orders multiple undone steps with the next redo first',
      actions: [
        discrete('a'),
        discrete('ab'),
        { type: 'undo' },
        { type: 'undo' },
      ],
      expected: { past: [], present: '', future: ['a', 'ab'] },
    },
    {
      name: 'ignores undo when there is nothing to undo',
      initial: 'a',
      actions: [{ type: 'undo' }],
      expected: { past: [], present: 'a', future: [] },
    },
    {
      name: 'redoes an undone step',
      actions: [discrete('a'), { type: 'undo' }, { type: 'redo' }],
      expected: { past: [''], present: 'a', future: [] },
    },
    {
      name: 'ignores redo when there is nothing to redo',
      actions: [discrete('a'), { type: 'redo' }],
      expected: { past: [''], present: 'a', future: [] },
    },
    {
      name: 'clears the redo steps when a new step is recorded',
      actions: [discrete('a'), { type: 'undo' }, discrete('b')],
      expected: { past: [''], present: 'b', future: [] },
    },
    {
      name: 'starts a new step for typing right after an undo',
      actions: [
        typing('a', 1000),
        typing('ab', 1100),
        discrete('ab!'),
        { type: 'undo' },
        typing('abc', 1200),
      ],
      expected: { past: ['', 'ab'], present: 'abc', future: [] },
    },
    {
      name: 'resets to a new baseline on an unexpected external value',
      actions: [
        discrete('a'),
        discrete('ab'),
        { type: 'undo' },
        { type: 'sync', value: 'loaded', asStep: false },
      ],
      expected: { past: [], present: 'loaded', future: [] },
    },
    {
      name: 'records an expected external value as a step',
      actions: [discrete('a'), { type: 'sync', value: 'a\n---', asStep: true }],
      expected: { past: ['', 'a'], present: 'a\n---', future: [] },
    },
    {
      name: 'ignores a sync that matches the present value',
      actions: [
        discrete('a'),
        { type: 'sync', value: 'a', asStep: false },
        { type: 'sync', value: 'a', asStep: true },
      ],
      expected: { past: [''], present: 'a', future: [] },
    },
  ];

  it.each(tests)('$name', ({ initial = '', actions, expected }) => {
    const state = run(createInitialHistory(initial), actions);

    expect(summarize(state)).toEqual(expected);
  });

  it(`keeps at most ${MAX_HISTORY_STEPS} steps, dropping the oldest`, () => {
    const actions = Array.from({ length: MAX_HISTORY_STEPS + 2 }, (_, i) =>
      discrete(`v${i + 1}`),
    );

    const state = run(createInitialHistory('v0'), actions);

    expect(state.past).toHaveLength(MAX_HISTORY_STEPS);
    expect(state.past[0].value).toBe('v2');
    expect(state.present.value).toBe(`v${MAX_HISTORY_STEPS + 2}`);
  });

  it('restores the selection stored with the step being returned to', () => {
    const selected: MarkdownFormatResult = {
      value: '**a**',
      selectionStart: 2,
      selectionEnd: 3,
    };

    const state = run(createInitialHistory('a'), [
      { type: 'record', entry: selected, kind: 'discrete', now: 0 },
      discrete('**a**b'),
      { type: 'undo' },
    ]);

    expect(state.present).toEqual(selected);
  });
});

describe('getHistoryShortcut', () => {
  const base = {
    key: 'z',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
  };

  it.each([
    { name: 'Ctrl+Z', event: { ctrlKey: true }, expected: 'undo' },
    { name: 'Cmd+Z', event: { metaKey: true }, expected: 'undo' },
    {
      name: 'Ctrl+Shift+Z',
      event: { key: 'Z', ctrlKey: true, shiftKey: true },
      expected: 'redo',
    },
    {
      name: 'Cmd+Shift+Z',
      event: { key: 'Z', metaKey: true, shiftKey: true },
      expected: 'redo',
    },
    { name: 'Ctrl+Y', event: { key: 'y', ctrlKey: true }, expected: 'redo' },
    {
      name: 'Ctrl+Shift+Y',
      event: { key: 'Y', ctrlKey: true, shiftKey: true },
      expected: null,
    },
    { name: 'plain Z', event: {}, expected: null },
    {
      name: 'Ctrl+Alt+Z',
      event: { ctrlKey: true, altKey: true },
      expected: null,
    },
    { name: 'Ctrl+B', event: { key: 'b', ctrlKey: true }, expected: null },
  ])('maps $name to $expected', ({ event, expected }) => {
    expect(getHistoryShortcut({ ...base, ...event })).toBe(expected);
  });
});
