import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { Mock } from 'vitest';

import { EntityListHook, EntityReviewConfig } from '../../types';
import { Question } from '../../types/api';
import { useQuestions } from '../../hooks/useQuestions';

import { QuestionsReviewTab } from './QuestionsReviewTab';

vi.mock('../../hooks/useQuestions');

// Companion to QuestionsReviewTab.test.tsx, split out to stay under the
// project's max-lines limit. Covers the search wiring, so this file only
// needs the search-related props of EntityReviewTab.
vi.mock('../shared/components/EntityReviewTab', () => ({
  EntityReviewTab: (props: {
    config: EntityReviewConfig;
    entityListHook: EntityListHook<Question>;
  }) =>
    !props.config.enableSearch ? null : (
      <div>
        <span>{props.config.searchPlaceholder}</span>
        <button onClick={() => props.entityListHook.setSearchTerm('apple')}>
          Search
        </button>
        <button onClick={() => props.entityListHook.setSearchTerm('')}>
          Clear Search
        </button>
      </div>
    ),
}));

const LocationSearch = () => (
  <span data-testid='location-search'>{useLocation().search}</span>
);

const renderTab = (path: string, currentPage = 1) => {
  const hook = {
    currentPage,
    fetchEntities: vi.fn().mockResolvedValue(undefined),
    setSearchTerm: vi.fn(),
  };
  (useQuestions as Mock).mockReturnValue(hook);

  render(
    <MemoryRouter initialEntries={[path]}>
      <QuestionsReviewTab />
      <LocationSearch />
    </MemoryRouter>,
  );

  return hook;
};

describe('QuestionsReviewTab search', () => {
  afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('enables search with a placeholder', () => {
    renderTab('/');

    expect(
      screen.getByText('Search questions and options...'),
    ).toBeInTheDocument();
  });

  it.each([
    { name: 'the persisted term', stored: 'banana', expected: 'banana' },
    { name: 'an empty term', stored: null, expected: '' },
  ])('starts with $name', ({ stored, expected }) => {
    if (stored !== null) {
      sessionStorage.setItem('question-review-search', stored);
    }

    renderTab('/');

    expect(useQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ initialSearchTerm: expected }),
    );
  });

  it('persists the term and drops the page param on search', async () => {
    const user = userEvent.setup();
    const { setSearchTerm } = renderTab(
      '/?tab=questions&page=3&sort=count_practise',
      3,
    );

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(setSearchTerm).toHaveBeenCalledWith('apple');
    expect(sessionStorage.getItem('question-review-search')).toBe('apple');
    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '?tab=questions&sort=count_practise',
    );
  });

  it('removes the persisted term when the search is cleared', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('question-review-search', 'apple');
    const { setSearchTerm } = renderTab('/');

    await user.click(screen.getByRole('button', { name: 'Clear Search' }));

    expect(setSearchTerm).toHaveBeenCalledWith('');
    expect(sessionStorage.getItem('question-review-search')).toBeNull();
  });
});
