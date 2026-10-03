import { render, screen } from '@testing-library/react';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';

import { WordHeader } from './WordHeader';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 7,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 3,
  definitions: [
    {
      id: 1,
      definition: 'a fruit',
      examples: [],
      notes: '',
      part_of_speech: 'noun',
      phonetics: {},
    },
  ],
  ...overrides,
});

describe('WordHeader', () => {
  it('renders the word text as the title, with its id, definition count, and practice count', () => {
    render(
      <WordHeader
        word={buildWord({ word: 'banana' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'banana' })).toBeInTheDocument();
    expect(screen.getByText('Word ID: 7')).toBeInTheDocument();
    expect(screen.getByText(/1 definition\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/3 practise\(s\)/)).toBeInTheDocument();
  });
});
