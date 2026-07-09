import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { Word } from '../../types/api';
import { FamiliarityLevel } from '../../types/base';

import { WordCard } from './WordCard';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 2,
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

const renderWithRouter = (word: Word) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path='/' element={<WordCard index={1} word={word} />} />
        <Route path='/word/:wordText' element={<div>Word detail page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('WordCard', () => {
  it('renders the word and definition/practice counts', () => {
    renderWithRouter(buildWord());
    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByText(/1 definition/)).toBeInTheDocument();
    expect(screen.getByText(/2 practises/)).toBeInTheDocument();
  });

  it('uses singular phrasing for one practice', () => {
    renderWithRouter(buildWord({ count_practise: 1 }));
    expect(screen.getByText(/1 practise\b/)).toBeInTheDocument();
  });

  it('navigates to the word detail page when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(buildWord({ word: 'apple' }));

    await user.click(screen.getByText('apple'));
    expect(screen.getByText('Word detail page')).toBeInTheDocument();
  });
});
