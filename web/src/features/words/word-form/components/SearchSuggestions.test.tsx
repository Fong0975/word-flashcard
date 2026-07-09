import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';
import { WordSearchState } from '../types';

import { SearchSuggestions } from './SearchSuggestions';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

const buildSearchState = (
  overrides: Partial<WordSearchState> = {},
): WordSearchState => ({
  suggestions: [buildWord()],
  isLoading: false,
  showSuggestions: true,
  ...overrides,
});

describe('SearchSuggestions', () => {
  it('renders nothing when showSuggestions is false', () => {
    const { container } = render(
      <SearchSuggestions
        searchState={buildSearchState({ showSuggestions: false })}
        mode='create'
        onSuggestionClick={jest.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders suggestions as clickable buttons in create mode', async () => {
    const user = userEvent.setup();
    const onSuggestionClick = jest.fn();
    const word = buildWord({ word: 'apple' });
    render(
      <SearchSuggestions
        searchState={buildSearchState({ suggestions: [word] })}
        mode='create'
        onSuggestionClick={onSuggestionClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'apple' }));
    expect(onSuggestionClick).toHaveBeenCalledWith(word);
  });

  it('renders suggestions as plain text in edit mode', () => {
    render(
      <SearchSuggestions
        searchState={buildSearchState({
          suggestions: [buildWord({ word: 'apple' })],
        })}
        mode='edit'
        onSuggestionClick={jest.fn()}
      />,
    );

    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'apple' }),
    ).not.toBeInTheDocument();
  });

  it('shows a loading indicator while searching', () => {
    render(
      <SearchSuggestions
        searchState={buildSearchState({ isLoading: true })}
        mode='create'
        onSuggestionClick={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Searching for similar words...'),
    ).toBeInTheDocument();
  });
});
