import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { EntityListHook } from '../../types';
import { Question } from '../../types/api';
import { useQuestions } from '../../hooks/useQuestions';

import { QuestionsReviewTab } from './QuestionsReviewTab';

jest.mock('../../hooks/useQuestions');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// EntityReviewTab, QuestionFormModal, QuestionStatsModal, and QuizSetupModal
// each have their own dedicated tests; here they're stubbed so these tests
// stay focused on QuestionsReviewTab's own responsibility: the URL-synced
// pagination/sort wiring (ref-based effects) and the modal/navigation glue.
jest.mock('../shared/components/EntityReviewTab', () => ({
  EntityReviewTab: (props: {
    entityListHook: EntityListHook<Question>;
    actions: {
      onNew?: () => void;
      onQuizSetup?: () => void;
      onRefresh?: () => void;
    };
    toolbarContent?: ReactNode;
    onTotalCountClick?: () => void;
    additionalContent?: ReactNode;
  }) => (
    <div>
      <span data-testid='current-page'>{props.entityListHook.currentPage}</span>
      <button onClick={() => props.entityListHook.nextPage()}>Next Page</button>
      <button onClick={() => props.entityListHook.previousPage()}>
        Previous Page
      </button>
      <button onClick={() => props.entityListHook.goToFirst()}>
        Go To First
      </button>
      <button onClick={() => props.entityListHook.goToLast()}>
        Go To Last
      </button>
      <button onClick={props.actions.onNew}>New</button>
      <button onClick={props.actions.onQuizSetup}>Quiz Setup</button>
      <button onClick={props.actions.onRefresh}>Refresh</button>
      <button onClick={props.onTotalCountClick}>Total Count</button>
      {props.toolbarContent}
      {props.additionalContent}
    </div>
  ),
}));

jest.mock('./question-form/QuestionFormModal', () => ({
  QuestionFormModal: (props: {
    isOpen: boolean;
    mode: string;
    onClose: () => void;
    onQuestionSaved: (question?: Question) => void;
  }) =>
    !props.isOpen ? null : (
      <div>
        <span>Question Form Open: {props.mode}</span>
        <button
          onClick={() =>
            props.onQuestionSaved({
              id: 99,
              question: 'New?',
              answer: 'A',
              option_a: 'A',
              count_failure_practise: 0,
              count_practise: 0,
              notes: '',
              reference: '',
            })
          }
        >
          Save With New Question
        </button>
        <button onClick={() => props.onQuestionSaved(undefined)}>
          Save Without New Question
        </button>
        <button onClick={props.onClose}>Close Form</button>
      </div>
    ),
}));

jest.mock('./QuestionStatsModal', () => ({
  QuestionStatsModal: (props: { isOpen: boolean; onClose: () => void }) =>
    !props.isOpen ? null : (
      <div>
        <span>Stats Open</span>
        <button onClick={props.onClose}>Close Stats</button>
      </div>
    ),
}));

jest.mock('../shared/components/QuizSetupModal', () => ({
  QuizSetupModal: (props: {
    isOpen: boolean;
    onClose: () => void;
    onStartQuiz: (config: { questionCount: number }) => void;
  }) =>
    !props.isOpen ? null : (
      <div>
        <span>Quiz Setup Open</span>
        <button onClick={() => props.onStartQuiz({ questionCount: 15 })}>
          Start Quiz
        </button>
        <button onClick={props.onClose}>Close Quiz Setup</button>
      </div>
    ),
}));

const buildQuestionsHook = (
  overrides: Partial<EntityListHook<Question>> = {},
): EntityListHook<Question> => ({
  entities: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 5,
  hasNext: true,
  hasPrevious: false,
  itemsPerPage: 20,
  searchTerm: '',
  totalCount: 50,
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

const renderTab = (
  path: string,
  hookOverrides: Partial<EntityListHook<Question>> = {},
) => {
  const hook = buildQuestionsHook(hookOverrides);
  (useQuestions as jest.Mock).mockReturnValue(hook);

  render(
    <MemoryRouter initialEntries={[path]}>
      <QuestionsReviewTab />
    </MemoryRouter>,
  );

  return hook;
};

describe('QuestionsReviewTab', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('URL-synced pagination', () => {
    it('fetches the URL page on mount when it differs from state', () => {
      const { fetchEntities } = renderTab('/?page=3', { currentPage: 1 });

      expect(fetchEntities).toHaveBeenCalledWith(3);
    });

    it('does not re-fetch on mount when the URL page matches state', () => {
      const { fetchEntities } = renderTab('/?page=3', { currentPage: 3 });

      expect(fetchEntities).not.toHaveBeenCalled();
    });

    it('advances the page and refetches on Next Page', async () => {
      const user = userEvent.setup();
      const { fetchEntities } = renderTab('/?page=2', {
        currentPage: 2,
        hasNext: true,
      });

      await user.click(screen.getByRole('button', { name: 'Next Page' }));

      expect(fetchEntities).toHaveBeenCalledWith(3);
    });

    it('does not advance the page when there is no next page', async () => {
      const user = userEvent.setup();
      const { fetchEntities } = renderTab('/?page=2', {
        currentPage: 2,
        hasNext: false,
      });

      await user.click(screen.getByRole('button', { name: 'Next Page' }));

      expect(fetchEntities).not.toHaveBeenCalled();
    });

    it('goes back and refetches when Previous Page is pressed', async () => {
      const user = userEvent.setup();
      const { fetchEntities } = renderTab('/?page=2', {
        currentPage: 2,
        hasPrevious: true,
      });

      await user.click(screen.getByRole('button', { name: 'Previous Page' }));

      expect(fetchEntities).toHaveBeenCalledWith(1);
    });

    it('jumps to the first and last page', async () => {
      const user = userEvent.setup();
      const { fetchEntities } = renderTab('/?page=2', {
        currentPage: 2,
        totalPages: 9,
      });

      await user.click(screen.getByRole('button', { name: 'Go To First' }));
      expect(fetchEntities).toHaveBeenCalledWith(1);

      await user.click(screen.getByRole('button', { name: 'Go To Last' }));
      expect(fetchEntities).toHaveBeenCalledWith(9);
    });
  });

  describe('sort control', () => {
    it('resets to page 1 and refetches on sort change', async () => {
      const user = userEvent.setup();
      const { fetchEntities } = renderTab('/?page=3', { currentPage: 3 });

      await user.selectOptions(screen.getByRole('combobox'), 'count_practise');

      expect(fetchEntities).toHaveBeenCalledWith(1);
    });
  });

  describe('modals', () => {
    it('opens the stats modal when the total count is clicked', async () => {
      const user = userEvent.setup();
      renderTab('/');

      await user.click(screen.getByRole('button', { name: 'Total Count' }));

      expect(screen.getByText('Stats Open')).toBeInTheDocument();
    });

    it('opens the add-question modal via New', async () => {
      const user = userEvent.setup();
      renderTab('/');

      await user.click(screen.getByRole('button', { name: 'New' }));

      expect(
        screen.getByText('Question Form Open: create'),
      ).toBeInTheDocument();
    });

    it('refreshes and navigates to the new question after saving', async () => {
      const user = userEvent.setup();
      const { refresh } = renderTab('/');

      await user.click(screen.getByRole('button', { name: 'New' }));
      await user.click(
        screen.getByRole('button', { name: 'Save With New Question' }),
      );

      expect(refresh).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/question/99');
    });

    it('only refreshes, no navigation, when saving with none', async () => {
      const user = userEvent.setup();
      const { refresh } = renderTab('/');

      await user.click(screen.getByRole('button', { name: 'New' }));
      await user.click(
        screen.getByRole('button', { name: 'Save Without New Question' }),
      );

      expect(refresh).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not throw when the post-save refresh fails', async () => {
      const user = userEvent.setup();
      renderTab('/', { refresh: jest.fn().mockRejectedValue(new Error('x')) });

      await user.click(screen.getByRole('button', { name: 'New' }));
      await user.click(
        screen.getByRole('button', { name: 'Save Without New Question' }),
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('starts the quiz with the configured count, closes setup', async () => {
      const user = userEvent.setup();
      renderTab('/');

      await user.click(screen.getByRole('button', { name: 'Quiz Setup' }));
      expect(screen.getByText('Quiz Setup Open')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Start Quiz' }));

      expect(mockNavigate).toHaveBeenCalledWith('/question/quiz?count=15');
      expect(screen.queryByText('Quiz Setup Open')).not.toBeInTheDocument();
    });
  });
});
