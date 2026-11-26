import { renderHook, act } from '@testing-library/react';
import type { MockInstance } from 'vitest';

import { Question } from '../../../../types/api';
import { apiService } from '../../../../lib/api';

import { useQuestionReminder } from './useQuestionReminder';

describe('useQuestionReminder', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it.each([
    {
      name: 'succeeds',
      response: () => Promise.resolve({} as Question),
      saved: true,
      error: null,
    },
    {
      name: 'fails',
      response: () => Promise.reject(new Error('save failed')),
      saved: false,
      error: 'Failed to save reminder: save failed',
    },
  ])(
    'reports the outcome when saving $name',
    async ({ response, saved, error }) => {
      const updateSpy = vi
        .spyOn(apiService, 'updateQuestionReminder')
        .mockImplementation(response);
      const onError = vi.fn();
      const { result } = renderHook(() => useQuestionReminder({ onError }));

      let outcome: boolean | undefined;
      await act(async () => {
        outcome = await result.current.saveReminder(7, 'check the tense');
      });

      expect(updateSpy).toHaveBeenCalledWith(7, 'check the tense');
      expect(outcome).toBe(saved);
      expect(result.current.saveError).toBe(error);
      expect(onError.mock.calls).toEqual(error ? [[error]] : []);
    },
  );

  it('resetReminder clears both the note and the save error', async () => {
    vi.spyOn(apiService, 'updateQuestionReminder').mockRejectedValue(
      new Error('save failed'),
    );
    const { result } = renderHook(() => useQuestionReminder());

    act(() => {
      result.current.setReminderEnabled(true);
      result.current.setReminderText('check the tense');
    });
    await act(async () => {
      await result.current.saveReminder(7, 'check the tense');
    });
    act(() => {
      result.current.resetReminder();
    });

    expect(result.current.reminderEnabled).toBe(false);
    expect(result.current.reminderText).toBe('');
    expect(result.current.saveError).toBeNull();
  });
});
