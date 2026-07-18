import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Toast, ToastContainer } from './Toast';

describe('Toast', () => {
  it('renders the message with an alert role', () => {
    render(<Toast id='1' message='Saved' type='success' onClose={jest.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Saved');
  });

  it('calls onClose when clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<Toast id='1' message='Saved' type='success' onClose={onClose} />);

    await user.click(screen.getByRole('alert'));
    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('calls onClose when Enter is pressed', () => {
    const onClose = jest.fn();
    render(<Toast id='1' message='Saved' type='success' onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole('alert'), { key: 'Enter' });
    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('auto-dismisses after the given duration', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
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
      jest.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalledWith('1');
    jest.useRealTimers();
  });

  it('renders info type styles and icon', () => {
    render(<Toast id='1' message='FYI' type='info' onClose={jest.fn()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-200');
    expect(alert).toContainHTML('M11.25 11.25l.041-.02');
    expect(screen.getByText('FYI')).toHaveClass('text-blue-800');
  });
});

describe('ToastContainer', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onRemoveToast={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each toast and forwards removal by id', async () => {
    const user = userEvent.setup();
    const onRemoveToast = jest.fn();
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
});
