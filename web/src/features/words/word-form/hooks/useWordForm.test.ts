import { renderHook, act } from '@testing-library/react';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';

import { useWordForm } from './useWordForm';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.RED,
  reminder: 'call back later',
  count_practise: 0,
  definitions: [],
  ...overrides,
});

describe('useWordForm', () => {
  it('starts blank in create mode', () => {
    const { result } = renderHook(() =>
      useWordForm({ mode: 'create', isOpen: true }),
    );

    expect(result.current.formData).toEqual({
      word: '',
      familiarity: FamiliarityLevel.GREEN,
    });
    expect(result.current.reminderState).toEqual({
      reminderEnabled: false,
      reminderText: '',
    });
    expect(result.current.isValid).toBe(false);
  });

  it('populates the form and reminder state from the word in edit mode', () => {
    const word = buildWord();
    const { result } = renderHook(() =>
      useWordForm({ mode: 'edit', word, isOpen: true }),
    );

    expect(result.current.formData).toEqual({
      word: 'apple',
      familiarity: FamiliarityLevel.RED,
    });
    expect(result.current.reminderState).toEqual({
      reminderEnabled: true,
      reminderText: 'call back later',
    });
    expect(result.current.isValid).toBe(true);
  });

  it('leaves the reminder disabled when the word has no reminder', () => {
    const word = buildWord({ reminder: null });
    const { result } = renderHook(() =>
      useWordForm({ mode: 'edit', word, isOpen: true }),
    );

    expect(result.current.reminderState).toEqual({
      reminderEnabled: false,
      reminderText: '',
    });
  });

  it('lowercases the word as it is typed', () => {
    const { result } = renderHook(() =>
      useWordForm({ mode: 'create', isOpen: true }),
    );

    act(() => {
      result.current.handlers.handleWordChange('APPLE');
    });

    expect(result.current.formData.word).toBe('apple');
  });

  it('updates the familiarity level', () => {
    const { result } = renderHook(() =>
      useWordForm({ mode: 'create', isOpen: true }),
    );

    act(() => {
      result.current.handlers.handleFamiliarityChange(FamiliarityLevel.YELLOW);
    });

    expect(result.current.formData.familiarity).toBe(FamiliarityLevel.YELLOW);
  });

  it('clears the reminder text when the reminder is disabled', () => {
    const { result } = renderHook(() =>
      useWordForm({ mode: 'create', isOpen: true }),
    );

    act(() => {
      result.current.handlers.handleReminderEnabledChange(true);
      result.current.handlers.handleReminderTextChange('call back');
    });
    expect(result.current.reminderState.reminderText).toBe('call back');

    act(() => {
      result.current.handlers.handleReminderEnabledChange(false);
    });

    expect(result.current.reminderState).toEqual({
      reminderEnabled: false,
      reminderText: '',
    });
  });

  it('resetForm clears the form and reminder state', () => {
    const word = buildWord();
    const { result } = renderHook(() =>
      useWordForm({ mode: 'edit', word, isOpen: true }),
    );

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual({
      word: '',
      familiarity: FamiliarityLevel.GREEN,
    });
    expect(result.current.reminderState).toEqual({
      reminderEnabled: false,
      reminderText: '',
    });
  });

  it.each<{
    name: string;
    mode: 'create' | 'edit';
    word?: Word;
    edit: (handlers: ReturnType<typeof useWordForm>['handlers']) => void;
    expected: boolean;
  }>([
    {
      name: 'clean for an untouched create form',
      mode: 'create',
      edit: () => {},
      expected: false,
    },
    {
      name: 'dirty once a word is typed in create mode',
      mode: 'create',
      edit: handlers => handlers.handleWordChange('banana'),
      expected: true,
    },
    {
      name: 'clean for an untouched edit form',
      mode: 'edit',
      word: buildWord(),
      edit: () => {},
      expected: false,
    },
    {
      name: 'dirty when the word text is changed',
      mode: 'edit',
      word: buildWord(),
      edit: handlers => handlers.handleWordChange('apples'),
      expected: true,
    },
    {
      name: 'clean when the word text is changed back',
      mode: 'edit',
      word: buildWord(),
      edit: handlers => {
        handlers.handleWordChange('apples');
        handlers.handleWordChange('apple');
      },
      expected: false,
    },
    {
      name: 'dirty when the familiarity is changed',
      mode: 'edit',
      word: buildWord(),
      edit: handlers =>
        handlers.handleFamiliarityChange(FamiliarityLevel.YELLOW),
      expected: true,
    },
    {
      name: 'dirty when the reminder text is changed',
      mode: 'edit',
      word: buildWord(),
      edit: handlers => handlers.handleReminderTextChange('call tomorrow'),
      expected: true,
    },
    {
      name: 'dirty when an existing reminder is disabled',
      mode: 'edit',
      word: buildWord(),
      edit: handlers => handlers.handleReminderEnabledChange(false),
      expected: true,
    },
    {
      name: 'clean when the reminder is enabled without a note',
      mode: 'edit',
      word: buildWord({ reminder: null }),
      edit: handlers => handlers.handleReminderEnabledChange(true),
      expected: false,
    },
  ])('isDirty is $name', ({ mode, word, edit, expected }) => {
    const { result } = renderHook(() =>
      useWordForm({ mode, word, isOpen: true }),
    );

    act(() => {
      edit(result.current.handlers);
    });

    expect(result.current.isDirty).toBe(expected);
  });
});
