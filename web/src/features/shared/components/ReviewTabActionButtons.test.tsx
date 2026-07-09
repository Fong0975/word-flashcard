import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReviewTabActionButtons } from './ReviewTabActionButtons';

describe('ReviewTabActionButtons', () => {
  it('renders no buttons when nothing is enabled', () => {
    render(<ReviewTabActionButtons showQuiz={false} isRefreshing={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders and triggers the Quiz button when enabled', async () => {
    const user = userEvent.setup();
    const onQuizSetup = jest.fn();
    render(
      <ReviewTabActionButtons
        showQuiz
        onQuizSetup={onQuizSetup}
        isRefreshing={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Quiz/ }));
    expect(onQuizSetup).toHaveBeenCalledTimes(1);
  });

  it('does not render the Quiz button when showQuiz is false', () => {
    render(
      <ReviewTabActionButtons
        showQuiz={false}
        onQuizSetup={jest.fn()}
        isRefreshing={false}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Quiz/ }),
    ).not.toBeInTheDocument();
  });

  it('renders and triggers the Refresh button', async () => {
    const user = userEvent.setup();
    const onRefresh = jest.fn();
    render(
      <ReviewTabActionButtons
        showQuiz={false}
        onRefresh={onRefresh}
        isRefreshing={false}
      />,
    );

    const button = screen.getByRole('button', { name: 'Refresh' });
    await user.click(button);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables and relabels the Refresh button while refreshing', () => {
    render(
      <ReviewTabActionButtons
        showQuiz={false}
        onRefresh={jest.fn()}
        isRefreshing
      />,
    );

    const button = screen.getByRole('button', { name: 'Refreshing...' });
    expect(button).toBeDisabled();
  });

  it('renders and triggers the Add button', async () => {
    const user = userEvent.setup();
    const onNew = jest.fn();
    render(
      <ReviewTabActionButtons
        showQuiz={false}
        onNew={onNew}
        isRefreshing={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Add/ }));
    expect(onNew).toHaveBeenCalledTimes(1);
  });
});
