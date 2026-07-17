import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { SearchOperation } from '../../types';
import { Word } from '../../types/api';
import { useWords, type UseWordsReturn } from '../../hooks/useWords';

import { WordsReviewTab } from './WordsReviewTab';

jest.mock('../../hooks/useWords');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Child modals are stubbed so these tests stay focused on WordsReviewTab's
// own glue logic. handleStartQuiz lives in WordsReviewTab.quiz.test.tsx
// alongside the QuizSetupModal mock, to keep this file under max-lines.
jest.mock('../shared/components/EntityReviewTab', () => ({
  EntityReviewTab: (props: {
    actions: {
      onNew?: () => void;
      onQuizSetup?: () => void;
      onRefresh?: () => void;
    };
    quickFiltersContent?: ReactNode;
    toolbarContent?: ReactNode;
    onTotalCountClick?: () => void;
    additionalContent?: ReactNode;
    entityListHook: { entities: Word[] };
    renderCard: (entity: Word, index: number) => ReactNode;
  }) => (
    <div>
      <button onClick={props.actions.onNew}>New</button>
      <button onClick={props.actions.onQuizSetup}>Quiz Setup</button>
      <button onClick={props.actions.onRefresh}>Refresh</button>
      <button onClick={props.onTotalCountClick}>Total Count</button>
      {props.toolbarContent}
      {props.quickFiltersContent}
      {props.entityListHook.entities.map((entity, index) => (
        <div key={entity.id}>{props.renderCard(entity, index)}</div>
      ))}
      {props.additionalContent}
    </div>
  ),
}));

jest.mock('./WordCard', () => ({
  WordCard: (props: { word: Word; onWordUpdated?: () => void }) => (
    <div>
      <span>Word Card: {props.word.word}</span>
      <button onClick={props.onWordUpdated}>Trigger Word Updated</button>
    </div>
  ),
}));

jest.mock('./word-form', () => ({
  WordFormModal: (props: {
    isOpen: boolean;
    mode: string;
    onClose: () => void;
    onWordSaved?: (newWordText?: string) => void;
    onOpenWordDetail?: (word: Word) => void;
    onError?: (message: string) => void;
    onWarning?: (message: string) => void;
  }) =>
    !props.isOpen ? null : (
      <div>
        <span>Word Form Open: {props.mode}</span>
        <button onClick={() => props.onWordSaved?.('newword')}>
          Save With New Word
        </button>
        <button onClick={() => props.onWordSaved?.(undefined)}>
          Save Without New Word
        </button>
        <button
          onClick={() =>
            props.onOpenWordDetail?.({
              id: 5,
              word: 'suggested',
              familiarity: 'red',
              reminder: null,
              count_practise: 0,
              definitions: [],
            } as Word)
          }
        >
          Open Suggestion
        </button>
        <button onClick={() => props.onError?.('form error')}>
          Trigger Error
        </button>
        <button onClick={() => props.onWarning?.('form warning')}>
          Trigger Warning
        </button>
        <button onClick={props.onClose}>Close Form</button>
      </div>
    ),
}));

jest.mock('./WordStatsModal', () => ({
  WordStatsModal: (props: { isOpen: boolean; onClose: () => void }) =>
    !props.isOpen ? null : (
      <div>
        <span>Stats Open</span>
        <button onClick={props.onClose}>Close Stats</button>
      </div>
    ),
}));

const buildTestWord = (overrides: Partial<Word> = {}): Word =>
  ({
    id: 1,
    word: 'apple',
    familiarity: 'red',
    reminder: null,
    count_practise: 0,
    definitions: [],
    ...overrides,
  }) as Word;

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
  fetchWords: jest.fn().mockResolvedValue(undefined),
  fetchEntities: jest.fn().mockResolvedValue(undefined),
  nextPage: jest.fn().mockResolvedValue(undefined),
  previousPage: jest.fn().mockResolvedValue(undefined),
  goToPage: jest.fn().mockResolvedValue(undefined),
  goToFirst: jest.fn().mockResolvedValue(undefined),
  goToLast: jest.fn().mockResolvedValue(undefined),
  refresh: jest.fn().mockResolvedValue(undefined),
  clearError: jest.fn(),
  setSearchTerm: jest.fn(),
  ...overrides,
});

const renderTab = (hookOverrides: Partial<UseWordsReturn> = {}) => {
  const hook = buildWordsHook(hookOverrides);
  (useWords as jest.Mock).mockReturnValue(hook);

  render(
    <MemoryRouter initialEntries={['/']}>
      <WordsReviewTab />
    </MemoryRouter>,
  );

  return hook;
};

const lastExtraConditions = () => {
  const calls = (useWords as jest.Mock).mock.calls;
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

describe('WordsReviewTab', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    { name: 'no active filter', clicks: [], expected: [] },
    {
      name: 'a single familiarity filter',
      clicks: ['Unfamiliar'],
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
      clicks: ['Unfamiliar', 'Somewhat Familiar'],
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
      clicks: ['Familiar', 'With Reminder'],
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

  describe('add-word modal and handleWordAdded', () => {
    it('opens the add-word modal via New', async () => {
      const user = userEvent.setup();
      renderTab();

      await user.click(screen.getByRole('button', { name: 'New' }));

      expect(screen.getByText('Word Form Open: create')).toBeInTheDocument();
    });

    it.each([
      { name: 'a returned word text', saveLabel: 'Save With New Word' },
      { name: 'no returned word text', saveLabel: 'Save Without New Word' },
    ])(
      'refreshes without navigating when saved with $name',
      async ({ saveLabel }) => {
        const user = userEvent.setup();
        const { refresh } = renderTab();

        await clickButtons(user, ['New', saveLabel]);

        expect(refresh).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      },
    );

    it('does not throw when the post-save refresh rejects', async () => {
      const user = userEvent.setup();
      renderTab({ refresh: jest.fn().mockRejectedValue(new Error('x')) });

      await clickButtons(user, ['New', 'Save Without New Word']);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('closes the add-word modal via Close Form', async () => {
      const user = userEvent.setup();
      renderTab();

      await clickButtons(user, ['New']);
      expect(screen.getByText('Word Form Open: create')).toBeInTheDocument();

      await clickButtons(user, ['Close Form']);
      expect(
        screen.queryByText('Word Form Open: create'),
      ).not.toBeInTheDocument();
    });
  });

  it('navigates to the encoded word path from a form suggestion', async () => {
    const user = userEvent.setup();
    renderTab();

    await clickButtons(user, ['New', 'Open Suggestion']);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/word/${encodeURIComponent('suggested')}`,
    );
  });

  describe('stats modal', () => {
    it('opens the stats modal when the total count is clicked', async () => {
      const user = userEvent.setup();
      renderTab();

      await user.click(screen.getByRole('button', { name: 'Total Count' }));

      expect(screen.getByText('Stats Open')).toBeInTheDocument();
    });

    it('closes the stats modal via Close Stats', async () => {
      const user = userEvent.setup();
      renderTab();

      await clickButtons(user, ['Total Count']);
      expect(screen.getByText('Stats Open')).toBeInTheDocument();

      await clickButtons(user, ['Close Stats']);
      expect(screen.queryByText('Stats Open')).not.toBeInTheDocument();
    });
  });

  it.each([
    { name: 'error', triggerLabel: 'Trigger Error', message: 'form error' },
    {
      name: 'warning',
      triggerLabel: 'Trigger Warning',
      message: 'form warning',
    },
  ])('routes a form $name to the toast', async ({ triggerLabel, message }) => {
    const user = userEvent.setup();
    renderTab();

    await clickButtons(user, ['New', triggerLabel]);

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('updates the sort selection and refetches page 1 when the sort changes', async () => {
    const user = userEvent.setup();
    const { fetchEntities } = renderTab();

    await user.selectOptions(screen.getByRole('combobox'), 'Practice count');

    expect(screen.getByRole('combobox')).toHaveValue('count_practise,word');
    expect(fetchEntities).toHaveBeenCalledWith(1);
  });

  it('calls refresh when the Refresh button is clicked', async () => {
    const user = userEvent.setup();
    const { refresh } = renderTab();

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(refresh).toHaveBeenCalled();
  });

  it('refreshes when a rendered word card reports an update', async () => {
    const user = userEvent.setup();
    const { refresh } = renderTab({ entities: [buildTestWord()] });

    expect(screen.getByText('Word Card: apple')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Trigger Word Updated' }),
    );

    expect(refresh).toHaveBeenCalled();
  });
});
