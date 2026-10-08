import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { Question } from '../../../types/api';
import { apiService } from '../../../lib/api';

import { QuestionQuiz, NextActionProps } from './QuestionQuiz';

// Companion to QuestionQuiz.test.tsx, split out to stay under the project's
// max-lines limit. Covers the answer outcome reported for the card glow as the
// quiz moves between the answering and review stages.

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '3',
  option_c: '5',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 0,
  notes: '',
  reference: '',
  ...overrides,
});

const noop = () => {};

const lastNextAction = (spy: Mock): NextActionProps | null => {
  const { calls } = spy.mock;
  return calls.length > 0 ? calls[calls.length - 1][0] : null;
};

describe('QuestionQuiz answer glow', () => {
  beforeEach(() => {
    // Keeps the shuffled options in their original A/B/C/D order; see
    // QuestionQuiz.test.tsx.
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { name: 'a correct answer', radioIndex: 0, isCorrect: true },
    { name: 'an incorrect answer', radioIndex: 1, isCorrect: false },
  ])(
    'reports the answer glow for $name: nothing until submitted, the outcome while reviewing, then nothing again',
    async ({ radioIndex, isCorrect }) => {
      const user = userEvent.setup();
      const onNextAction = vi.fn();
      const onAnswerGlowChange = vi.fn();
      vi.spyOn(apiService, 'getRandomQuestions').mockResolvedValue([
        buildQuestion({ id: 1, question: 'First?' }),
        buildQuestion({ id: 2, question: 'Second?' }),
      ]);
      vi.spyOn(apiService, 'updateQuestion').mockResolvedValue(buildQuestion());

      const { unmount } = render(
        <QuestionQuiz
          questionCount={2}
          onQuizComplete={noop}
          onBackToHome={noop}
          onNextAction={onNextAction}
          onAnswerGlowChange={onAnswerGlowChange}
        />,
      );

      expect(onAnswerGlowChange).toHaveBeenLastCalledWith(undefined);

      await screen.findByRole('heading', { name: 'First?' });
      await user.click(screen.getAllByRole('radio')[radioIndex]);
      expect(onAnswerGlowChange).toHaveBeenLastCalledWith(undefined);

      lastNextAction(onNextAction)!.onClick();
      expect(
        await screen.findByText(
          `Result: ${isCorrect ? 'correct' : 'incorrect'}`,
        ),
      ).toBeInTheDocument();
      expect(onAnswerGlowChange).toHaveBeenLastCalledWith(isCorrect);

      lastNextAction(onNextAction)!.onClick();
      await screen.findByRole('heading', { name: 'Second?' });
      expect(onAnswerGlowChange).toHaveBeenLastCalledWith(undefined);

      await user.click(screen.getAllByRole('radio')[radioIndex]);
      lastNextAction(onNextAction)!.onClick();
      await waitFor(() =>
        expect(onAnswerGlowChange).toHaveBeenLastCalledWith(isCorrect),
      );

      unmount();
      expect(onAnswerGlowChange).toHaveBeenLastCalledWith(undefined);
    },
  );
});
