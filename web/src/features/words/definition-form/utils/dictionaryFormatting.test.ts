import { CambridgePronunciation, CambridgeDefinition } from '../types';

import {
  groupPronunciationsByPos,
  formatPronunciationSuccessMessage,
  formatDefinitionSuccessMessage,
} from './dictionaryFormatting';

const buildPronunciation = (
  overrides: Partial<CambridgePronunciation> = {},
): CambridgePronunciation => ({
  pos: 'noun',
  lang: 'uk',
  url: 'http://example.com/uk.mp3',
  pron: '/wɜːd/',
  ...overrides,
});

describe('groupPronunciationsByPos', () => {
  it('pairs the uk and us entries for the same part of speech', () => {
    const uk = buildPronunciation({ pos: 'noun', lang: 'uk' });
    const us = buildPronunciation({ pos: 'noun', lang: 'us' });

    expect(groupPronunciationsByPos([uk, us])).toEqual([
      { pos: 'noun', uk, us },
    ]);
  });

  it('defaults to "general" when pos is missing', () => {
    const uk = buildPronunciation({ pos: '', lang: 'uk' });

    expect(groupPronunciationsByPos([uk])).toEqual([
      { pos: 'general', uk, us: null },
    ]);
  });

  it('keeps the other accent null when only one is present', () => {
    const uk = buildPronunciation({ pos: 'verb', lang: 'uk' });

    expect(groupPronunciationsByPos([uk])).toEqual([
      { pos: 'verb', uk, us: null },
    ]);
  });

  it('preserves the order in which parts of speech first appear', () => {
    const nounUk = buildPronunciation({ pos: 'noun', lang: 'uk' });
    const verbUk = buildPronunciation({ pos: 'verb', lang: 'uk' });
    const nounUs = buildPronunciation({ pos: 'noun', lang: 'us' });

    expect(
      groupPronunciationsByPos([nounUk, verbUk, nounUs]).map(g => g.pos),
    ).toEqual(['noun', 'verb']);
  });
});

describe('formatPronunciationSuccessMessage', () => {
  it('returns a generic message when neither URL is provided', () => {
    expect(formatPronunciationSuccessMessage('', '')).toBe(
      'Pronunciation data applied successfully!',
    );
  });

  it('mentions only UK when just the UK URL is provided', () => {
    expect(formatPronunciationSuccessMessage('uk.mp3', '')).toBe(
      'UK pronunciation URL applied successfully!',
    );
  });

  it('mentions only US when just the US URL is provided', () => {
    expect(formatPronunciationSuccessMessage('', 'us.mp3')).toBe(
      'US pronunciation URL applied successfully!',
    );
  });

  it('uses plural phrasing and "and" when both URLs are provided', () => {
    expect(formatPronunciationSuccessMessage('uk.mp3', 'us.mp3')).toBe(
      'UK and US pronunciation URLs applied successfully!',
    );
  });

  it('appends the part of speech when it is not "general"', () => {
    expect(formatPronunciationSuccessMessage('uk.mp3', '', 'noun')).toBe(
      'UK pronunciation URL (noun) applied successfully!',
    );
  });

  it('omits the part of speech suffix when it is "general"', () => {
    expect(formatPronunciationSuccessMessage('uk.mp3', '', 'general')).toBe(
      'UK pronunciation URL applied successfully!',
    );
  });
});

describe('formatDefinitionSuccessMessage', () => {
  const buildDefinition = (
    overrides: Partial<CambridgeDefinition> = {},
  ): CambridgeDefinition => ({
    id: 1,
    pos: 'noun',
    text: 'a thing',
    translation: '',
    example: [],
    ...overrides,
  });

  it('mentions part of speech and definition when pos is present', () => {
    expect(formatDefinitionSuccessMessage(buildDefinition(), 0)).toBe(
      'Applied part of speech, definition successfully!',
    );
  });

  it('omits part of speech when it is missing', () => {
    expect(
      formatDefinitionSuccessMessage(buildDefinition({ pos: '' }), 0),
    ).toBe('Applied definition successfully!');
  });

  it('uses singular phrasing for exactly one example', () => {
    expect(
      formatDefinitionSuccessMessage(buildDefinition({ pos: '' }), 1),
    ).toBe('Applied definition, 1 example successfully!');
  });

  it('uses plural phrasing for more than one example', () => {
    expect(
      formatDefinitionSuccessMessage(buildDefinition({ pos: '' }), 3),
    ).toBe('Applied definition, 3 examples successfully!');
  });
});
