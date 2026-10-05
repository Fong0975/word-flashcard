import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { WordQuizResult } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';

import { WordQuizPage } from './WordQuizPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

// WordQuiz and WordQuizResults each get their own dedicated test file that
// exercises their real behaviour; here they're stubbed out so these tests
// stay focused on WordQuizPage's own responsibility: parsing/validating the
// URL config, switching between the quiz/results views, and wiring the exit
// guard.
vi.mock('./WordQuiz', () => ({
  WordQuiz: (props: {
    selectedFamiliarity: readonly string[];
    questionCount: number;
    perCategoryCounts?: { red: number; yellow: number; green: number };
    onQuizComplete: (results: WordQuizResult[]) => void;
    onFamiliarityGlowChange?: (level: FamiliarityLevel | undefined) => void;
  }) => (
    <div>
      <span data-testid='word-quiz-props'>
        {JSON.stringify({
          selectedFamiliarity: props.selectedFamiliarity,
          questionCount: props.questionCount,
          perCategoryCounts: props.perCategoryCounts,
        })}
      </span>
      <button onClick={() => props.onQuizComplete(mockResults)}>
        Complete Quiz
      </button>
      {(['red', 'yellow', 'green'] as FamiliarityLevel[]).map(level => (
        <button
          key={level}
          onClick={() => props.onFamiliarityGlowChange?.(level)}
        >
          Glow {level}
        </button>
      ))}
      <button onClick={() => props.onFamiliarityGlowChange?.(undefined)}>
        Glow none
      </button>
    </div>
  ),
}));

vi.mock('./WordQuizResults', () => ({
  WordQuizResults: (props: { results: WordQuizResult[] }) => (
    <div>Results: {props.results.length}</div>
  ),
}));

const mockResults: WordQuizResult[] = [
  {
    word: {
      id: 1,
      word: 'apple',
      familiarity: FamiliarityLevel.YELLOW,
      reminder: null,
      count_practise: 1,
      definitions: [],
    },
    oldFamiliarity: FamiliarityLevel.RED,
    newFamiliarity: FamiliarityLevel.YELLOW,
  },
];

const renderPage = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <WordQuizPage />
    </MemoryRouter>,
  );

describe('WordQuizPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // DetailPageLayout renders the real Header, whose useDarkMode hook reads
    // window.matchMedia; jsdom doesn't implement it, so stub it out.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('config validation', () => {
    it('shows the invalid config screen when no params are provided, and navigates home from it', async () => {
      const user = userEvent.setup();
      renderPage('/word/quiz');

      expect(
        screen.getByText('Invalid quiz configuration'),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Back to Home' }));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('shows the invalid config screen when the category counts are all zero', () => {
      renderPage('/word/quiz?red=0&yellow=0&green=0');

      expect(
        screen.getByText('Invalid quiz configuration'),
      ).toBeInTheDocument();
    });

    it('renders the quiz with count/familiarity mode when valid', () => {
      renderPage('/word/quiz?count=10&familiarity=green,yellow');

      const props = JSON.parse(
        screen.getByTestId('word-quiz-props').textContent || '{}',
      );
      expect(props.questionCount).toBe(10);
      expect(props.selectedFamiliarity).toEqual(['green', 'yellow']);
      expect(props.perCategoryCounts).toBeUndefined();
    });

    it('renders the quiz with per-category counts when in category mode', () => {
      renderPage('/word/quiz?red=2&yellow=3&green=0');

      const props = JSON.parse(
        screen.getByTestId('word-quiz-props').textContent || '{}',
      );
      expect(props.perCategoryCounts).toEqual({ red: 2, yellow: 3, green: 0 });
    });
  });

  describe('familiarity glow on the content card', () => {
    it.each([
      { button: 'Glow red', expected: 'glass-glow-red' },
      { button: 'Glow yellow', expected: 'glass-glow-yellow' },
      { button: 'Glow green', expected: 'glass-glow-green' },
    ])(
      'applies $expected when the quiz reports it',
      async ({ button, expected }) => {
        const user = userEvent.setup();
        renderPage('/word/quiz?count=5&familiarity=green');

        const card = screen.getByTestId('detail-page-card');
        expect(card).not.toHaveClass('glass-glow');

        await user.click(screen.getByRole('button', { name: button }));

        expect(card).toHaveClass('glass-glow', expected);
      },
    );

    it('removes the glow when the quiz reports no familiarity, and on the results view', async () => {
      const user = userEvent.setup();
      renderPage('/word/quiz?count=5&familiarity=green');
      const card = screen.getByTestId('detail-page-card');

      await user.click(screen.getByRole('button', { name: 'Glow red' }));
      await user.click(screen.getByRole('button', { name: 'Glow none' }));
      expect(card).not.toHaveClass('glass-glow');

      await user.click(screen.getByRole('button', { name: 'Glow red' }));
      await user.click(screen.getByRole('button', { name: 'Complete Quiz' }));
      expect(screen.getByTestId('detail-page-card')).not.toHaveClass(
        'glass-glow',
      );
    });
  });

  describe('state transitions', () => {
    it('switches to the results view with the retake footer when the quiz completes, and back to the quiz when retaking', async () => {
      const user = userEvent.setup();
      renderPage('/word/quiz?count=5&familiarity=green');

      await user.click(screen.getByRole('button', { name: 'Complete Quiz' }));

      expect(screen.getByText('Results: 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Again' }));

      expect(screen.getByTestId('word-quiz-props')).toBeInTheDocument();
    });

    it('navigates home when "Home" is pressed on the results footer', async () => {
      const user = userEvent.setup();
      renderPage('/word/quiz?count=5&familiarity=green');

      await user.click(screen.getByRole('button', { name: 'Complete Quiz' }));
      await user.click(screen.getByRole('button', { name: 'Home' }));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('exit guard while a quiz is in progress', () => {
    it('shows a confirmation dialog instead of navigating immediately, and stays on the quiz when the exit is cancelled', async () => {
      const user = userEvent.setup();
      renderPage('/word/quiz?count=5&familiarity=green');

      await user.click(screen.getByRole('button', { name: 'Go back' }));

      expect(
        screen.getByRole('heading', { name: 'Exit Quiz' }),
      ).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: 'Continue Quiz' }));

      expect(
        screen.queryByRole('heading', { name: 'Exit Quiz' }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('word-quiz-props')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates home after confirming the exit', async () => {
      const user = userEvent.setup();
      renderPage('/word/quiz?count=5&familiarity=green');

      await user.click(screen.getByRole('button', { name: 'Go back' }));
      await user.click(screen.getByRole('button', { name: 'Exit Quiz' }));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('navigates home directly, without a dialog, when going back from the results view', async () => {
      const user = userEvent.setup();
      renderPage('/word/quiz?count=5&familiarity=green');

      await user.click(screen.getByRole('button', { name: 'Complete Quiz' }));
      await user.click(screen.getByRole('button', { name: 'Go back' }));

      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(
        screen.queryByRole('heading', { name: 'Exit Quiz' }),
      ).not.toBeInTheDocument();
    });
  });
});
