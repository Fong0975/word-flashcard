import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuizResultsFooter } from './QuizResultsFooter';

describe('QuizResultsFooter', () => {
  it('calls onRetakeQuiz and onBackToHome when clicked', async () => {
    const user = userEvent.setup();
    const onRetakeQuiz = jest.fn();
    const onBackToHome = jest.fn();
    render(
      <QuizResultsFooter
        onRetakeQuiz={onRetakeQuiz}
        onBackToHome={onBackToHome}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Again/ }));
    expect(onRetakeQuiz).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Home/ }));
    expect(onBackToHome).toHaveBeenCalledTimes(1);
  });
});
