import { render, screen } from '@testing-library/react';

import { buildQuestion } from '../questionQuizTestHelpers';

import { AnswerReviewStage } from './AnswerReviewStage';

describe('AnswerReviewStage', () => {
  it.each([
    { isCorrect: true, result: 'Result: correct' },
    { isCorrect: false, result: 'Result: incorrect' },
  ])(
    'shows the question, the accuracy change and "$result"',
    ({ isCorrect, result }) => {
      render(
        <AnswerReviewStage
          question={buildQuestion({
            count_practise: 1,
            count_failure_practise: 0,
          })}
          options={[]}
          selectedAnswer='A'
          correctAnswer='A'
          isCorrect={isCorrect}
          updatedStats={{ countPractise: 2, countFailurePractise: 1 }}
        >
          <p>extra content</p>
        </AnswerReviewStage>,
      );

      expect(screen.getByText(result)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'What is 2 + 2?' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Accuracy: 100% (1/1) → 50% (1/2)'),
      ).toBeInTheDocument();
      expect(screen.getByText('extra content')).toBeInTheDocument();
    },
  );
});
