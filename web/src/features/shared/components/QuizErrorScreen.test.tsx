import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuizErrorScreen } from './QuizErrorScreen';

describe('QuizErrorScreen', () => {
  it('renders the error message', () => {
    render(
      <QuizErrorScreen
        error='Failed to load quiz'
        onRetry={vi.fn()}
        onBackToHome={vi.fn()}
      />,
    );
    expect(screen.getByText('Failed to load quiz')).toBeInTheDocument();
  });

  it('calls onRetry and onBackToHome when clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onBackToHome = vi.fn();
    render(
      <QuizErrorScreen
        error='Failed to load quiz'
        onRetry={onRetry}
        onBackToHome={onBackToHome}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(onBackToHome).toHaveBeenCalledTimes(1);
  });
});
