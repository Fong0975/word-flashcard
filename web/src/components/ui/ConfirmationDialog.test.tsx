import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmationDialog } from './ConfirmationDialog';

const baseProps = {
  title: 'Delete Word',
  message: 'Are you sure?',
  confirmText: 'Delete',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
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
    const onConfirm = vi.fn();
    render(<ConfirmationDialog {...baseProps} isOpen onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmationDialog {...baseProps} isOpen onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while confirming', () => {
    render(<ConfirmationDialog {...baseProps} isOpen isConfirming />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Delete/ })).toBeDisabled();
  });

  it.each([
    ['danger', 'glass-button-danger', 'bg-red-600'],
    ['warning', 'glass-button-warning', 'bg-yellow-600'],
  ] as const)(
    'uses the glass confirm button for the %s variant',
    (variant, glassClass, solidClass) => {
      render(<ConfirmationDialog {...baseProps} isOpen variant={variant} />);

      const confirm = screen.getByRole('button', { name: 'Delete' });
      expect(confirm).toHaveClass(glassClass);
      expect(confirm).not.toHaveClass(solidClass);
    },
  );

  it('renders the info variant icon and confirm button styles', () => {
    render(<ConfirmationDialog {...baseProps} isOpen variant='info' />);

    expect(document.body).toContainHTML('M13 16h-1v-4h-1m1-4h.01');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'glass-button-primary',
    );
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
