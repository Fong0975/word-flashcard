import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuizExitConfirmDialog } from './QuizExitConfirmDialog';

describe('QuizExitConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <QuizExitConfirmDialog
        isOpen={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the confirmation message when open', () => {
    render(
      <QuizExitConfirmDialog
        isOpen
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Exit Quiz' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Your progress will be lost/)).toBeInTheDocument();
  });

  it('calls onCancel when continuing the quiz', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(
      <QuizExitConfirmDialog
        isOpen
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue Quiz' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when exiting the quiz', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(
      <QuizExitConfirmDialog
        isOpen
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Exit Quiz' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
