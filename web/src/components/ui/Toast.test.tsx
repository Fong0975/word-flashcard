import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Toast, ToastContainer } from './Toast';

describe('Toast', () => {
  it('renders the message with an alert role', () => {
    render(<Toast id='1' message='Saved' type='success' onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Saved');
  });

  it('calls onClose when clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Toast id='1' message='Saved' type='success' onClose={onClose} />);

    await user.click(screen.getByRole('alert'));
    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('calls onClose when Enter is pressed', () => {
    const onClose = vi.fn();
    render(<Toast id='1' message='Saved' type='success' onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole('alert'), { key: 'Enter' });
    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('auto-dismisses after the given duration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <Toast
        id='1'
        message='Saved'
        type='success'
        duration={1000}
        onClose={onClose}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalledWith('1');
    vi.useRealTimers();
  });

  it('renders info type styles and icon', () => {
    render(<Toast id='1' message='FYI' type='info' onClose={vi.fn()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-200');
    expect(alert).toContainHTML('M11.25 11.25l.041-.02');
    expect(screen.getByText('FYI')).toHaveClass('text-blue-800');
  });

  it('renders a progress bar timed to the auto-dismiss duration', () => {
    render(
      <Toast
        id='1'
        message='Saved'
        type='success'
        duration={1500}
        onClose={vi.fn()}
      />,
    );

    const progressBar = screen.getByTestId('toast-progress-bar');
    expect(progressBar).toHaveClass('bg-green-400');
    expect(progressBar).toHaveStyle({ animationDuration: '1500ms' });
  });

  it('defaults the progress bar duration to 4000ms', () => {
    render(<Toast id='1' message='Saved' type='info' onClose={vi.fn()} />);

    expect(screen.getByTestId('toast-progress-bar')).toHaveStyle({
      animationDuration: '4000ms',
    });
  });
});

describe('ToastContainer', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onRemoveToast={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each toast and forwards removal by id', async () => {
    const user = userEvent.setup();
    const onRemoveToast = vi.fn();
    render(
      <ToastContainer
        toasts={[
          { id: '1', message: 'First', type: 'success' },
          { id: '2', message: 'Second', type: 'error' },
        ]}
        onRemoveToast={onRemoveToast}
      />,
    );

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);

    await user.click(alerts[0]);
    expect(onRemoveToast).toHaveBeenCalledWith('1');
  });

  it('portals the toast outside of a transformed ancestor', () => {
    const { container } = render(
      <div style={{ transform: 'translate(0, 0)' }}>
        <ToastContainer
          toasts={[{ id: '1', message: 'Saved', type: 'success' }]}
          onRemoveToast={vi.fn()}
        />
      </div>,
    );

    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(screen.getByRole('alert')).toBe(
      document.body.querySelector('[role="alert"]'),
    );
  });
});
