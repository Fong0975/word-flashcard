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
});
