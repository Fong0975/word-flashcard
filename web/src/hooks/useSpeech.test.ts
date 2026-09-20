import { renderHook, act } from '@testing-library/react';
import type { Mock } from 'vitest';

import { speakText } from '../features/shared/speech';

import { useSpeech } from './useSpeech';

vi.mock('../features/shared/speech');

const mockedSpeakText = speakText as Mock;

const lastOnEnd = (callIndex: number): (() => void) =>
  mockedSpeakText.mock.calls[callIndex][2];

describe('useSpeech', () => {
  beforeEach(() => {
    mockedSpeakText.mockReset();
    mockedSpeakText.mockReturnValue(true);
  });

  it('is not speaking initially', () => {
    const { result } = renderHook(() => useSpeech());
    expect(result.current.isSpeaking).toBe(false);
  });

  it('marks isSpeaking while speaking and clears it when the utterance ends', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak('apple', 'en-US');
    });
    expect(mockedSpeakText).toHaveBeenCalledWith(
      'apple',
      'en-US',
      expect.any(Function),
    );
    expect(result.current.isSpeaking).toBe(true);

    act(() => lastOnEnd(0)());
    expect(result.current.isSpeaking).toBe(false);
  });

  it('does not enter the speaking state when speech is unavailable', () => {
    mockedSpeakText.mockReturnValue(false);
    const { result } = renderHook(() => useSpeech());

    let started = true;
    act(() => {
      started = result.current.speak('apple', 'en-US');
    });

    expect(started).toBe(false);
    expect(result.current.isSpeaking).toBe(false);
  });

  it('ignores end events from a superseded utterance', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak('apple', 'en-US');
    });
    act(() => {
      result.current.speak('apple', 'en-US');
    });

    act(() => lastOnEnd(0)());
    expect(result.current.isSpeaking).toBe(true);

    act(() => lastOnEnd(1)());
    expect(result.current.isSpeaking).toBe(false);
  });
});
