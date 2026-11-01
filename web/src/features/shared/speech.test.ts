import type { Mock } from 'vitest';

import { isAppleMobileDevice } from '../../utils/platform';

import { speakText, warmUpSpeech } from './speech';

vi.mock('../../utils/platform', () => ({ isAppleMobileDevice: vi.fn() }));

type MockUtterance = { text: string; lang: string; volume?: number };

class FakeUtterance {
  text: string;
  lang = '';
  volume = 1;
  constructor(text: string) {
    this.text = text;
  }
}

describe('warmUpSpeech', () => {
  const speak = vi.fn();
  let now = 1_000_000;

  beforeEach(() => {
    speak.mockReset();
    vi.useFakeTimers();
    // Each case starts well outside the previous case's warm-up window.
    now += 60_000;
    vi.setSystemTime(now);
    (
      global as unknown as { SpeechSynthesisUtterance: unknown }
    ).SpeechSynthesisUtterance = FakeUtterance;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    delete (global as unknown as { SpeechSynthesisUtterance?: unknown })
      .SpeechSynthesisUtterance;
  });

  it.each([
    {
      name: 'does nothing when the Web Speech API is unavailable',
      synthesis: undefined,
      isApple: true,
      expectedCalls: 0,
    },
    {
      name: 'does nothing on non-Apple devices',
      synthesis: { speaking: false },
      isApple: false,
      expectedCalls: 0,
    },
    {
      name: 'does nothing while speech is already in progress',
      synthesis: { speaking: true },
      isApple: true,
      expectedCalls: 0,
    },
    {
      name: 'speaks an inaudible utterance on Apple devices',
      synthesis: { speaking: false },
      isApple: true,
      expectedCalls: 1,
    },
  ])('$name', ({ synthesis, isApple, expectedCalls }) => {
    vi.mocked(isAppleMobileDevice).mockReturnValue(isApple);
    if (synthesis) {
      (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
        ...synthesis,
        speak,
      };
    }

    warmUpSpeech();

    expect(speak).toHaveBeenCalledTimes(expectedCalls);
    if (expectedCalls > 0) {
      const utterance = speak.mock.calls[0][0] as MockUtterance;
      expect(utterance.volume).toBe(0);
      expect(utterance.text.trim()).toBe('');
    }
  });

  it('skips warming up again inside the interval and resumes after it', () => {
    vi.mocked(isAppleMobileDevice).mockReturnValue(true);
    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
      speaking: false,
      speak,
    };

    warmUpSpeech();
    vi.advanceTimersByTime(1000);
    warmUpSpeech();
    expect(speak).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    warmUpSpeech();
    expect(speak).toHaveBeenCalledTimes(2);
  });
});

describe('speakText', () => {
  afterEach(() => {
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    delete (global as unknown as { SpeechSynthesisUtterance?: unknown })
      .SpeechSynthesisUtterance;
  });

  it('returns false when the Web Speech API is unavailable', () => {
    expect(window.speechSynthesis).toBeUndefined();
    expect(speakText('hello')).toBe(false);
  });

  it('speaks the given text with the default locale', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    (
      window as unknown as {
        speechSynthesis: { speak: Mock; cancel: Mock };
      }
    ).speechSynthesis = { speak, cancel };
    (
      global as unknown as {
        SpeechSynthesisUtterance: new (text: string) => MockUtterance;
      }
    ).SpeechSynthesisUtterance = class {
      text: string;
      lang = '';
      constructor(text: string) {
        this.text = text;
      }
    };

    const result = speakText('hello');

    expect(result).toBe(true);
    expect(speak).toHaveBeenCalledTimes(1);
    const spokenUtterance = speak.mock.calls[0][0] as MockUtterance;
    expect(spokenUtterance.text).toBe('hello');
    expect(spokenUtterance.lang).toBe('en-US');
  });

  it('applies a custom locale', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    (
      window as unknown as {
        speechSynthesis: { speak: Mock; cancel: Mock };
      }
    ).speechSynthesis = { speak, cancel };
    (
      global as unknown as {
        SpeechSynthesisUtterance: new (text: string) => MockUtterance;
      }
    ).SpeechSynthesisUtterance = class {
      text: string;
      lang = '';
      constructor(text: string) {
        this.text = text;
      }
    };

    speakText('hello', 'en-GB');

    const spokenUtterance = speak.mock.calls[0][0] as MockUtterance;
    expect(spokenUtterance.lang).toBe('en-GB');
  });

  it('cancels any speech already in progress before speaking', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    (
      window as unknown as {
        speechSynthesis: { speak: Mock; cancel: Mock };
      }
    ).speechSynthesis = { speak, cancel };
    (
      global as unknown as {
        SpeechSynthesisUtterance: new (text: string) => MockUtterance;
      }
    ).SpeechSynthesisUtterance = class {
      text: string;
      lang = '';
      constructor(text: string) {
        this.text = text;
      }
    };

    speakText('hello');

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      speak.mock.invocationCallOrder[0],
    );
  });

  it.each([
    { name: 'finishes', event: 'onend' },
    { name: 'fails or is cancelled', event: 'onerror' },
  ] as const)('invokes onEnd when the utterance $name', ({ event }) => {
    const speak = vi.fn();
    const cancel = vi.fn();
    (
      window as unknown as {
        speechSynthesis: { speak: Mock; cancel: Mock };
      }
    ).speechSynthesis = { speak, cancel };
    (
      global as unknown as {
        SpeechSynthesisUtterance: new (text: string) => MockUtterance;
      }
    ).SpeechSynthesisUtterance = class {
      text: string;
      lang = '';
      constructor(text: string) {
        this.text = text;
      }
    };
    const onEnd = vi.fn();

    speakText('hello', 'en-US', onEnd);

    const utterance = speak.mock.calls[0][0] as Record<string, () => void>;
    expect(onEnd).not.toHaveBeenCalled();
    utterance[event]();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
