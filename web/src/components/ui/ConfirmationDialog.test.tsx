import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmationDialog } from './ConfirmationDialog';

const baseProps = {
  title: 'Delete Word',
  message: 'Are you sure?',
  confirmText: 'Delete',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

describe('ConfirmationDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmationDialog {...baseProps} isOpen={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title, message, and default cancel text when open', () => {
    render(<ConfirmationDialog {...baseProps} isOpen />);

    expect(screen.getByText('Delete Word')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(<ConfirmationDialog {...baseProps} isOpen onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(<ConfirmationDialog {...baseProps} isOpen onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while confirming', () => {
    render(<ConfirmationDialog {...baseProps} isOpen isConfirming />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Delete/ })).toBeDisabled();
  });

  it('uses a custom cancel label when provided', () => {
    render(
      <ConfirmationDialog {...baseProps} isOpen cancelText='Never mind' />,
    );

    expect(
      screen.getByRole('button', { name: 'Never mind' }),
    ).toBeInTheDocument();
  });
});
