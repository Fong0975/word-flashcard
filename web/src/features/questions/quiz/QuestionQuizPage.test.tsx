import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { QuestionQuizResult } from '../../../types/api';

import { QuestionQuizPage } from './QuestionQuizPage';

const mockNavigate = jest.fn();
const mockActionClick = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// QuestionQuiz and QuestionQuizResults each get their own dedicated test
// file; here they're stubbed so these tests stay focused on
// QuestionQuizPage's own responsibility: URL config validation, the
// quiz/results state machine, the dynamically-reported footer action, and
// the exit guard.
jest.mock('./QuestionQuiz', () => ({
  QuestionQuiz: (props: {
    onQuizComplete: (results: QuestionQuizResult[]) => void;
    onNextAction?: (
      action: {
        onClick: () => void;
        label: string;
        disabled?: boolean;
        loading?: boolean;
      } | null,
    ) => void;
  }) => (
    <div>
      <button
        onClick={() =>
          props.onNextAction?.({
            onClick: mockActionClick,
            label: 'Submit Answer',
          })
        }
      >
        Report Submit Action
      </button>
      <button
        onClick={() =>
          props.onNextAction?.({
            onClick: mockActionClick,
            label: 'Submit Answer',
            loading: true,
          })
        }
      >
        Report Loading Submit Action
      </button>
      <button onClick={() => props.onNextAction?.(null)}>
        Clear Next Action
      </button>
      <button onClick={() => props.onQuizComplete(mockResults)}>
        Complete Quiz
      </button>
    </div>
  ),
}));

jest.mock('./QuestionQuizResults', () => ({
  QuestionQuizResults: (props: { results: QuestionQuizResult[] }) => (
    <div>Results: {props.results.length}</div>
  ),
}));

const mockResults: QuestionQuizResult[] = [
  {
    question: {
      id: 1,
      question: 'Q?',
      answer: 'A',
      option_a: 'A',
      count_failure_practise: 0,
      count_practise: 1,
      notes: '',
      reference: '',
    },
    userAnswer: 'A',
    isCorrect: true,
    updatedStats: { countPractise: 1, countFailurePractise: 0 },
  },
];

const renderPage = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <QuestionQuizPage />
    </MemoryRouter>,
  );

describe('QuestionQuizPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockActionClick.mockClear();
    // DetailPageLayout renders the real Header, whose useDarkMode hook reads
    // window.matchMedia; jsdom doesn't implement it, so stub it out.
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('config validation', () => {
    it('shows the invalid config screen when count is missing', () => {
      renderPage('/question/quiz');

      expect(
        screen.getByText('Invalid quiz configuration'),
      ).toBeInTheDocument();
    });

    it('shows the invalid config screen when count is not positive', () => {
      renderPage('/question/quiz?count=0');

      expect(
        screen.getByText('Invalid quiz configuration'),
      ).toBeInTheDocument();
    });

    it('navigates home when "Back to Home" is pressed', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz');

      await user.click(screen.getByRole('button', { name: 'Back to Home' }));

      expect(mockNavigate).toHaveBeenCalledWith('/?tab=questions');
    });

    it('renders the quiz when count is valid', () => {
      renderPage('/question/quiz?count=5');

      expect(
        screen.getByRole('button', { name: 'Report Submit Action' }),
      ).toBeInTheDocument();
    });
  });

  describe('dynamically reported footer action', () => {
    it('renders the reported action as the footer button', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(
        screen.getByRole('button', { name: 'Report Submit Action' }),
      );
      await user.click(screen.getByRole('button', { name: 'Submit Answer' }));

      expect(mockActionClick).toHaveBeenCalled();
    });

    it('removes the footer button once the action is cleared', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(
        screen.getByRole('button', { name: 'Report Submit Action' }),
      );
      expect(
        screen.getByRole('button', { name: 'Submit Answer' }),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole('button', { name: 'Clear Next Action' }),
      );
      expect(
        screen.queryByRole('button', { name: 'Submit Answer' }),
      ).not.toBeInTheDocument();
    });

    it('disables the footer button and shows a spinner when the action is loading', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(
        screen.getByRole('button', { name: 'Report Loading Submit Action' }),
      );

      const footerButton = screen.getByRole('button', {
        name: 'Submit Answer',
      });
      expect(footerButton).toBeDisabled();
      expect(
        within(footerButton).getByTestId('footer-action-spinner'),
      ).toBeInTheDocument();
    });

    it('keeps the footer button enabled and spinner-free when not loading', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(
        screen.getByRole('button', { name: 'Report Submit Action' }),
      );

      const footerButton = screen.getByRole('button', {
        name: 'Submit Answer',
      });
      expect(footerButton).not.toBeDisabled();
      expect(
        within(footerButton).queryByTestId('footer-action-spinner'),
      ).not.toBeInTheDocument();
    });
  });

  describe('state transitions', () => {
    it('switches to results and shows the retake footer', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(screen.getByRole('button', { name: 'Complete Quiz' }));

      expect(screen.getByText('Results: 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Again' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    });

    it('returns to the quiz view when retaking', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(screen.getByRole('button', { name: 'Complete Quiz' }));
      await user.click(screen.getByRole('button', { name: 'Again' }));

      expect(
        screen.getByRole('button', { name: 'Report Submit Action' }),
      ).toBeInTheDocument();
    });

    it('navigates home when "Home" is pressed', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(screen.getByRole('button', { name: 'Complete Quiz' }));
      await user.click(screen.getByRole('button', { name: 'Home' }));

      expect(mockNavigate).toHaveBeenCalledWith('/?tab=questions');
    });
  });

  describe('exit guard while a quiz is in progress', () => {
    it('shows a confirmation dialog instead of navigating', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(screen.getByRole('button', { name: 'Go back' }));

      expect(
        screen.getByRole('heading', { name: 'Exit Quiz' }),
      ).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates home after confirming the exit', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(screen.getByRole('button', { name: 'Go back' }));
      await user.click(screen.getByRole('button', { name: 'Exit Quiz' }));

      expect(mockNavigate).toHaveBeenCalledWith('/?tab=questions');
    });

    it('stays on the quiz when the exit is cancelled', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(screen.getByRole('button', { name: 'Go back' }));
      await user.click(screen.getByRole('button', { name: 'Continue Quiz' }));

      expect(
        screen.queryByRole('heading', { name: 'Exit Quiz' }),
      ).not.toBeInTheDocument();
    });

    it('navigates home directly, without a dialog, from results', async () => {
      const user = userEvent.setup();
      renderPage('/question/quiz?count=5');

      await user.click(screen.getByRole('button', { name: 'Complete Quiz' }));
      await user.click(screen.getByRole('button', { name: 'Go back' }));

      expect(mockNavigate).toHaveBeenCalledWith('/?tab=questions');
    });
  });
});
