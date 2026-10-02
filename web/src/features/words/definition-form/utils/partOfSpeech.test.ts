import {
  PART_OF_SPEECH_OPTIONS,
  normalizePartOfSpeech,
  normalizePartsOfSpeech,
} from './partOfSpeech';

describe('normalizePartOfSpeech', () => {
  const tests: { name: string; input: string; expected: string }[] = [
    ...PART_OF_SPEECH_OPTIONS.map(option => ({
      name: `keeps the allowed value "${option}"`,
      input: option,
      expected: option,
    })),
    {
      name: 'ignores case and surrounding spaces',
      input: ' Noun ',
      expected: 'noun',
    },
    {
      name: 'maps a prepositional phrase to phrase',
      input: 'prepositional phrase',
      expected: 'phrase',
    },
    {
      name: 'maps a phrasal verb to phrase',
      input: 'phrasal verb',
      expected: 'phrase',
    },
    { name: 'maps an idiom to phrase', input: 'idiom', expected: 'phrase' },
    {
      name: 'maps a proper noun to noun',
      input: 'proper noun',
      expected: 'noun',
    },
    {
      name: 'maps a modal verb to verb',
      input: 'modal verb',
      expected: 'verb',
    },
    { name: 'maps a pronoun to other', input: 'pronoun', expected: 'other' },
    {
      name: 'maps an interjection to other',
      input: 'interjection',
      expected: 'other',
    },
    { name: 'maps an empty label to other', input: '', expected: 'other' },
  ];

  tests.forEach(tt => {
    it(tt.name, () => {
      expect(normalizePartOfSpeech(tt.input)).toBe(tt.expected);
    });
  });
});

describe('normalizePartsOfSpeech', () => {
  const tests: { name: string; input: string[]; expected: string[] }[] = [
    { name: 'returns an empty list for no labels', input: [], expected: [] },
    {
      name: 'normalizes every label and keeps allowed ones',
      input: ['noun', 'idiom', 'pronoun'],
      expected: ['noun', 'phrase', 'other'],
    },
    {
      name: 'removes duplicates created by normalization',
      input: ['phrasal verb', 'idiom', 'phrase'],
      expected: ['phrase'],
    },
  ];

  tests.forEach(tt => {
    it(tt.name, () => {
      expect(normalizePartsOfSpeech(tt.input)).toEqual(tt.expected);
    });
  });
});
