import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { Mock } from 'vitest';

import { useQuestions } from '../../hooks/useQuestions';
import { WITH_REMINDER_CONDITIONS } from '../shared/constants/reminder';

import { QuestionsReviewTab } from './QuestionsReviewTab';

vi.mock('../../hooks/useQuestions');

// Companion to QuestionsReviewTab.test.tsx, covering only the quick filter
// wiring, so this file only needs the quickFiltersContent prop.
vi.mock('../shared/components/EntityReviewTab', () => ({
  EntityReviewTab: (props: { quickFiltersContent?: ReactNode }) => (
    <div>{props.quickFiltersContent}</div>
  ),
}));

const LocationSearch = () => (
  <span data-testid='location-search'>{useLocation().search}</span>
);

const renderTab = (path = '/') => {
  const hook = {
    currentPage: 1,
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

const lastExtraConditions = () =>
  (useQuestions as Mock).mock.lastCall?.[0]?.extraConditions;

describe('QuestionsReviewTab quick filters', () => {
  afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it.each([
    { name: 'no filter', clicks: 0, expected: undefined },
    {
      name: 'the With Reminder filter',
      clicks: 1,
      expected: WITH_REMINDER_CONDITIONS,
    },
    { name: 'the filter toggled back off', clicks: 2, expected: undefined },
  ])('passes the conditions for $name', async ({ clicks, expected }) => {
    const user = userEvent.setup();
    renderTab();

    for (let i = 0; i < clicks; i++) {
      await user.click(screen.getByRole('button', { name: 'With Reminder' }));
    }

    expect(lastExtraConditions()).toEqual(expected);
  });

  it('restores the persisted filter', () => {
    sessionStorage.setItem(
      'question-review-quick-filters',
      JSON.stringify(['withReminder']),
    );

    renderTab();

    expect(lastExtraConditions()).toEqual(WITH_REMINDER_CONDITIONS);
  });

  it('returns to the first page and refetches when the filter changes', async () => {
    const user = userEvent.setup();
    const { fetchEntities } = renderTab('/?tab=questions&page=3');
    fetchEntities.mockClear();

    await user.click(screen.getByRole('button', { name: 'With Reminder' }));

    expect(fetchEntities).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '?tab=questions',
    );
    expect(screen.getByTestId('location-search')).not.toHaveTextContent(
      'page=',
    );
  });
});
