import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Word } from '../../types/api';
import { useWords, type UseWordsReturn } from '../../hooks/useWords';

import { WordsReviewTab } from './WordsReviewTab';

jest.mock('../../hooks/useWords');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Companion to WordsReviewTab.test.tsx, split out to stay under the
// project's max-lines limit. Covers handleStartQuiz (URL building from the
// quiz setup config) and closing the quiz setup modal, so this file mocks
// QuizSetupModal directly instead of stubbing it away like the other file.
jest.mock('../shared/components/EntityReviewTab', () => ({
  EntityReviewTab: (props: {
    actions: { onQuizSetup?: () => void };
    additionalContent?: ReactNode;
    entityListHook: { entities: Word[] };
    renderCard: (entity: Word, index: number) => ReactNode;
  }) => (
    <div>
      <button onClick={props.actions.onQuizSetup}>Quiz Setup</button>
      {props.entityListHook.entities.map((entity, index) => (
        <div key={entity.id}>{props.renderCard(entity, index)}</div>
      ))}
      {props.additionalContent}
    </div>
  ),
}));

jest.mock('./WordCard', () => ({
  WordCard: () => null,
}));

jest.mock('./word-form', () => ({
  WordFormModal: () => null,
}));

jest.mock('./WordStatsModal', () => ({
  WordStatsModal: () => null,
}));

// Each key below doubles as a test button label; the value is the config
// handleStartQuiz receives when that button is clicked.
jest.mock('../shared/components/QuizSetupModal', () => {
  const quizConfigs: Record<string, unknown> = {
    'Start All Categories': {
      questionCount: 0,
      perCategoryCounts: { red: 5, yellow: 3, green: 2 },
    },
    'Start Red Only': {
      questionCount: 0,
      perCategoryCounts: { red: 5, yellow: 0, green: 0 },
    },
    'Start Zero Categories': {
      questionCount: 0,
      perCategoryCounts: { red: 0, yellow: 0, green: 0 },
    },
    'Start By Count Only': { questionCount: 20 },
    'Start By Count And Familiarity': {
      questionCount: 20,
      selectedFamiliarity: ['red', 'yellow'],
    },
  };

  return {
    QuizSetupModal: (props: {
      isOpen: boolean;
      onClose: () => void;
      onStartQuiz: (config: unknown) => void;
    }) =>
      !props.isOpen ? null : (
        <div>
          <span>Quiz Setup Open</span>
          {Object.entries(quizConfigs).map(([label, config]) => (
            <button key={label} onClick={() => props.onStartQuiz(config)}>
              {label}
            </button>
          ))}
          <button onClick={props.onClose}>Close Quiz Setup</button>
        </div>
      ),
  };
});

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

const clickButtons = async (
  user: ReturnType<typeof userEvent.setup>,
  labels: string[],
) => {
  for (const label of labels) {
    await user.click(screen.getByRole('button', { name: label }));
  }
};

describe('WordsReviewTab quiz setup', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // handleStartQuiz: URL built from per-category counts vs. plain count.
  describe.each([
    {
      name: 'all three category counts',
      startLabel: 'Start All Categories',
      expectedUrl: '/word/quiz?red=5&yellow=3&green=2',
    },
    {
      name: 'only a positive category count',
      startLabel: 'Start Red Only',
      expectedUrl: '/word/quiz?red=5',
    },
    {
      name: 'every category count at zero',
      startLabel: 'Start Zero Categories',
      expectedUrl: '/word/quiz?',
    },
    {
      name: 'a plain question count',
      startLabel: 'Start By Count Only',
      expectedUrl: '/word/quiz?count=20',
    },
    {
      name: 'a question count with familiarity',
      startLabel: 'Start By Count And Familiarity',
      expectedUrl: '/word/quiz?count=20&familiarity=red%2Cyellow',
    },
  ])('handleStartQuiz with $name', ({ startLabel, expectedUrl }) => {
    it('navigates to the expected quiz URL and closes the modal', async () => {
      const user = userEvent.setup();
      renderTab();

      await clickButtons(user, ['Quiz Setup', startLabel]);

      expect(mockNavigate).toHaveBeenCalledWith(expectedUrl);
      expect(screen.queryByText('Quiz Setup Open')).not.toBeInTheDocument();
    });
  });

  // handleCloseQuizSetupModal: closing the quiz setup modal without starting a quiz.
  it('closes the quiz setup modal via Close Quiz Setup', async () => {
    const user = userEvent.setup();
    renderTab();

    await clickButtons(user, ['Quiz Setup']);
    expect(screen.getByText('Quiz Setup Open')).toBeInTheDocument();

    await clickButtons(user, ['Close Quiz Setup']);
    expect(screen.queryByText('Quiz Setup Open')).not.toBeInTheDocument();
  });
});
