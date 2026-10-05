import { render, screen } from '@testing-library/react';

import { Word, WordDefinition } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';

import { WordQuestionDisplay } from './WordQuestionDisplay';

const buildDefinition = (
  overrides: Partial<WordDefinition> = {},
): WordDefinition => ({
  id: 1,
  definition: 'a fruit',
  examples: [],
  notes: '',
  part_of_speech: 'noun',
  phonetics: {},
  ...overrides,
});

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 2,
  definitions: [],
  ...overrides,
});

describe('WordQuestionDisplay', () => {
  it('renders the word text and practice count', () => {
    render(
      <WordQuestionDisplay
        word={buildWord()}
        pronunciationUrls={{}}
        hasUkUrl={false}
        hasUsUrl={false}
      />,
    );

    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByText('Practice #3')).toBeInTheDocument();
  });

  it.each([
    {
      name: 'the word level by default',
      familiarity: undefined,
      expected: 'glass-glow-green',
    },
    {
      name: 'the given level when provided',
      familiarity: FamiliarityLevel.RED,
      expected: 'glass-glow-red',
    },
  ])('shows the familiarity bar with $name', ({ familiarity, expected }) => {
    render(
      <WordQuestionDisplay
        word={buildWord()}
        familiarity={familiarity}
        pronunciationUrls={{}}
        hasUkUrl={false}
        hasUsUrl={false}
      />,
    );

    expect(screen.getByTestId('familiarity-bar')).toHaveClass(expected);
  });

  it('deduplicates parts of speech across definitions', () => {
    render(
      <WordQuestionDisplay
        word={buildWord({
          definitions: [
            buildDefinition({ id: 1, part_of_speech: 'noun' }),
            buildDefinition({ id: 2, part_of_speech: 'noun' }),
          ],
        })}
        pronunciationUrls={{}}
        hasUkUrl={false}
        hasUsUrl={false}
      />,
    );

    expect(screen.getAllByText('noun')).toHaveLength(1);
  });

  it('shows the singular definition count', () => {
    render(
      <WordQuestionDisplay
        word={buildWord({ definitions: [buildDefinition()] })}
        pronunciationUrls={{}}
        hasUkUrl={false}
        hasUsUrl={false}
      />,
    );

    expect(screen.getByText(/Total 1 definition\b/)).toBeInTheDocument();
  });

  it('shows the plural definition count', () => {
    render(
      <WordQuestionDisplay
        word={buildWord({
          definitions: [buildDefinition({ id: 1 }), buildDefinition({ id: 2 })],
        })}
        pronunciationUrls={{}}
        hasUkUrl={false}
        hasUsUrl={false}
      />,
    );

    expect(screen.getByText(/Total 2 definitions/)).toBeInTheDocument();
  });

  it('renders the pronunciation controls', () => {
    render(
      <WordQuestionDisplay
        word={buildWord()}
        pronunciationUrls={{}}
        hasUkUrl={false}
        hasUsUrl={false}
      />,
    );

    expect(screen.getByTitle('British pronunciation')).toBeInTheDocument();
    expect(screen.getByTitle('American pronunciation')).toBeInTheDocument();
  });
});
