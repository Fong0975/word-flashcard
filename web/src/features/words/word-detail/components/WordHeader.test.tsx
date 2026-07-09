import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
  it('renders the word id, definition count, and practice count', () => {
    render(
      <WordHeader word={buildWord()} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(screen.getByText('Word ID: 7')).toBeInTheDocument();
    expect(screen.getByText(/1 definition\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/3 practise\(s\)/)).toBeInTheDocument();
  });

  it('renders the word text as the title', () => {
    render(
      <WordHeader
        word={buildWord({ word: 'banana' })}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: 'banana' })).toBeInTheDocument();
  });

  it('delegates edit and delete clicks', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <WordHeader word={buildWord()} onEdit={onEdit} onDelete={onDelete} />,
    );

    await user.click(screen.getByTitle('Edit word'));
    expect(onEdit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTitle('Delete word'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
