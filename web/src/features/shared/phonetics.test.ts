import { extractPronunciationUrls, isValidAudioUrl } from './phonetics';

describe('extractPronunciationUrls', () => {
  it('returns an empty object when phonetics is undefined', () => {
    expect(extractPronunciationUrls(undefined)).toEqual({});
  });

  it('extracts direct string URLs from uk/us keys', () => {
    expect(
      extractPronunciationUrls({
        uk: 'http://example.com/uk.mp3',
        us: 'http://example.com/us.mp3',
      }),
    ).toEqual({
      uk: 'http://example.com/uk.mp3',
      us: 'http://example.com/us.mp3',
    });
  });

  it('extracts URLs nested inside an object under a known audio field', () => {
    expect(
      extractPronunciationUrls({
        uk: { audio: 'http://example.com/uk.mp3' },
        us: { url: 'http://example.com/us.mp3' },
      }),
    ).toEqual({
      uk: 'http://example.com/uk.mp3',
      us: 'http://example.com/us.mp3',
    });
  });

  it('infers the accent from a URL pattern when no known key matches', () => {
    expect(
      extractPronunciationUrls({
        pronunciation: 'http://example.com/gb/word.mp3',
      }),
    ).toEqual({ uk: 'http://example.com/gb/word.mp3' });
  });

  it('defaults to uk when the accent cannot be determined', () => {
    expect(
      extractPronunciationUrls({ sound: 'http://example.com/audio.mp3' }),
    ).toEqual({ uk: 'http://example.com/audio.mp3' });
  });

  it('returns an empty object when no extractable URL is found', () => {
    expect(extractPronunciationUrls({ note: 'not a url' })).toEqual({});
  });
});

describe('isValidAudioUrl', () => {
  it('returns false for an undefined url', () => {
    expect(isValidAudioUrl(undefined)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidAudioUrl('')).toBe(false);
  });

  it('returns true for a URL with an audio file extension', () => {
    expect(isValidAudioUrl('http://example.com/sound.mp3')).toBe(true);
  });

  it('returns true for a relative path with an audio-related segment', () => {
    expect(isValidAudioUrl('/audio/word')).toBe(true);
  });

  it('returns false for a string that is not a URL', () => {
    expect(isValidAudioUrl('not-a-url')).toBe(false);
  });

  it('returns false for a short URL with no audio indication', () => {
    expect(isValidAudioUrl('http://a')).toBe(false);
  });
});
