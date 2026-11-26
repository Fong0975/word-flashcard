import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReminderBanner } from './ReminderBanner';

const renderBanner = (onClear: () => Promise<void> = vi.fn()) => {
  const onError = vi.fn();
  render(
    <ReminderBanner
      reminder='Check plural form'
      entityName='question'
      onClear={onClear}
      onError={onError}
    />,
  );
  return { onError };
};

describe('ReminderBanner', () => {
  it('shows the reminder and names the entity in the confirmation', async () => {
    const user = userEvent.setup();
    renderBanner();

    expect(screen.getByText('Check plural form')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear reminder' }));

    expect(
      screen.getByText(
        'Are you sure you want to clear the reminder for this question?',
      ),
    ).toBeInTheDocument();
  });

  it.each([
    {
      name: 'clears and closes the dialog on confirm',
      button: 'Clear',
      clearCalls: 1,
    },
    {
      name: 'closes the dialog without clearing on cancel',
      button: 'Cancel',
      clearCalls: 0,
    },
  ])('$name', async ({ button, clearCalls }) => {
    const user = userEvent.setup();
    const onClear = vi.fn().mockResolvedValue(undefined);
    const { onError } = renderBanner(onClear);

    await user.click(screen.getByRole('button', { name: 'Clear reminder' }));
    await user.click(screen.getByRole('button', { name: button }));

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Clear Reminder' }),
      ).not.toBeInTheDocument(),
    );
    expect(onClear).toHaveBeenCalledTimes(clearCalls);
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports a failed clear and keeps the dialog open', async () => {
    const user = userEvent.setup();
    const { onError } = renderBanner(
      vi.fn().mockRejectedValue(new Error('clear failed')),
    );

    await user.click(screen.getByRole('button', { name: 'Clear reminder' }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        'Failed to clear reminder: clear failed',
      ),
    );
    expect(
      screen.getByRole('heading', { name: 'Clear Reminder' }),
    ).toBeInTheDocument();
  });
});
