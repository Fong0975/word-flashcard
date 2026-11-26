import { render, screen } from '@testing-library/react';

import { getScoreBadgeColor, getScoreColor } from '../constants/quiz';

import { QuizScoreHero } from './QuizScoreHero';

describe('QuizScoreHero', () => {
  it.each([
    { percentage: 80, tone: 'green' as const },
    { percentage: 33.3, tone: 'yellow' as const },
    { percentage: 0, tone: 'red' as const },
  ])(
    'renders $percentage% and its caption in the $tone tone',
    ({ percentage, tone }) => {
      render(
        <QuizScoreHero
          percentage={percentage}
          tone={tone}
          percentageLabel='score'
          caption='some caption'
        />,
      );

      const score = screen.getByLabelText('score');
      expect(score).toHaveTextContent(`${percentage}%`);
      expect(score).toHaveClass(...getScoreColor(tone).split(' '));
      expect(screen.getByText('some caption')).toHaveClass(
        ...getScoreBadgeColor(tone).split(' '),
      );
    },
  );
});
