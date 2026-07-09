import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SuccessNotification } from './SuccessNotification';

describe('SuccessNotification', () => {
  it('renders the message', () => {
    render(
      <SuccessNotification message='Definition added!' onClose={jest.fn()} />,
    );
    expect(screen.getByText('Definition added!')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<SuccessNotification message='Saved!' onClose={onClose} />);

    await user.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
