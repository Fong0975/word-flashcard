import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { SearchOperation } from '../../types';
import { FamiliarityLevel } from '../../types/base';
import { useWords, type UseWordsReturn } from '../../hooks/useWords';
import { FAMILIARITY_LABELS } from '../shared/constants/familiarity';

import { WordsReviewTab } from './WordsReviewTab';

const RED_LABEL = FAMILIARITY_LABELS[FamiliarityLevel.RED];
const YELLOW_LABEL = FAMILIARITY_LABELS[FamiliarityLevel.YELLOW];
const GREEN_LABEL = FAMILIARITY_LABELS[FamiliarityLevel.GREEN];

vi.mock('../../hooks/useWords');

// Companion to WordsReviewTab.test.tsx, split out to stay under the
// project's max-lines limit. Covers extraConditions (mapping active quick
// filters to search conditions), so this file only needs to render
// quickFiltersContent from EntityReviewTab's props.
vi.mock('../shared/components/EntityReviewTab', () => ({
  EntityReviewTab: (props: { quickFiltersContent?: ReactNode }) => (
    <div>{props.quickFiltersContent}</div>
  ),
}));

vi.mock('./WordCard', () => ({
  WordCard: () => null,
}));

vi.mock('./word-form', () => ({
  WordFormModal: () => null,
}));

vi.mock('./WordStatsModal', () => ({
  WordStatsModal: () => null,
}));

const buildWordsHook = (
  overrides: Partial<UseWordsReturn> = {},
): UseWordsReturn => ({
  words: [],
  entities: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
  itemsPerPage: 30,
  searchTerm: '',
  totalCount: 0,
  fetchWords: vi.fn().mockResolvedValue(undefined),
  fetchEntities: vi.fn().mockResolvedValue(undefined),
  nextPage: vi.fn().mockResolvedValue(undefined),
  previousPage: vi.fn().mockResolvedValue(undefined),
  goToPage: vi.fn().mockResolvedValue(undefined),
  goToFirst: vi.fn().mockResolvedValue(undefined),
  goToLast: vi.fn().mockResolvedValue(undefined),
  refresh: vi.fn().mockResolvedValue(undefined),
  clearError: vi.fn(),
  setSearchTerm: vi.fn(),
  ...overrides,
});

const renderTab = () => {
  const hook = buildWordsHook();
  (useWords as Mock).mockReturnValue(hook);

  render(
    <MemoryRouter initialEntries={['/']}>
      <WordsReviewTab />
    </MemoryRouter>,
  );
};

const lastExtraConditions = () => {
  const calls = (useWords as Mock).mock.calls;
  return calls[calls.length - 1][0].extraConditions;
};

const clickButtons = async (
  user: ReturnType<typeof userEvent.setup>,
  labels: string[],
) => {
  for (const label of labels) {
    await user.click(screen.getByRole('button', { name: label }));
  }
};

describe('WordsReviewTab extraConditions', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe.each([
    { name: 'no active filter', clicks: [], expected: [] },
    {
      name: 'a single familiarity filter',
      clicks: [RED_LABEL],
      expected: [
        {
          key: 'familiarity',
          operator: SearchOperation.IN,
          value: JSON.stringify(['red']),
        },
      ],
    },
    {
      name: 'multiple familiarity filters merged',
      clicks: [RED_LABEL, YELLOW_LABEL],
      expected: [
        {
          key: 'familiarity',
          operator: SearchOperation.IN,
          value: JSON.stringify(['red', 'yellow']),
        },
      ],
    },
    {
      name: 'the withReminder filter',
      clicks: ['With Reminder'],
      expected: [
        { key: 'reminder', operator: SearchOperation.IS_NOT_NULL },
        { key: 'reminder', operator: SearchOperation.IS_NOT_EMPTY },
      ],
    },
    {
      name: 'familiarity combined with withReminder',
      clicks: [GREEN_LABEL, 'With Reminder'],
      expected: [
        {
          key: 'familiarity',
          operator: SearchOperation.IN,
          value: JSON.stringify(['green']),
        },
        { key: 'reminder', operator: SearchOperation.IS_NOT_NULL },
        { key: 'reminder', operator: SearchOperation.IS_NOT_EMPTY },
      ],
    },
  ])('extraConditions with $name', ({ clicks, expected }) => {
    it('produces the expected search conditions', async () => {
      const user = userEvent.setup();
      renderTab();

      await clickButtons(user, clicks);

      expect(lastExtraConditions()).toEqual(expected);
    });
  });
});
