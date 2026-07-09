import { speakText } from './speech';

type MockUtterance = { text: string; lang: string };

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
    const speak = jest.fn();
    const cancel = jest.fn();
    (
      window as unknown as {
        speechSynthesis: { speak: jest.Mock; cancel: jest.Mock };
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
    const speak = jest.fn();
    const cancel = jest.fn();
    (
      window as unknown as {
        speechSynthesis: { speak: jest.Mock; cancel: jest.Mock };
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
    const speak = jest.fn();
    const cancel = jest.fn();
    (
      window as unknown as {
        speechSynthesis: { speak: jest.Mock; cancel: jest.Mock };
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
});
