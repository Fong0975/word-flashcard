import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReminderNoteInput } from './ReminderNoteInput';

describe('ReminderNoteInput', () => {
  it('reflects the enabled state on the checkbox', () => {
    render(
      <ReminderNoteInput
        enabled
        text=''
        onEnabledChange={jest.fn()}
        onTextChange={jest.fn()}
      />,
    );

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('disables the text input while not enabled', () => {
    render(
      <ReminderNoteInput
        enabled={false}
        text=''
        onEnabledChange={jest.fn()}
        onTextChange={jest.fn()}
      />,
    );

    expect(
      screen.getByPlaceholderText('Enter reminder note...'),
    ).toBeDisabled();
  });

  it('calls onEnabledChange when the checkbox is toggled', async () => {
    const user = userEvent.setup();
    const onEnabledChange = jest.fn();
    render(
      <ReminderNoteInput
        enabled={false}
        text=''
        onEnabledChange={onEnabledChange}
        onTextChange={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('checkbox'));
    expect(onEnabledChange).toHaveBeenCalledWith(true);
  });

  it('clears the text when the checkbox is unchecked', async () => {
    const user = userEvent.setup();
    const onTextChange = jest.fn();
    render(
      <ReminderNoteInput
        enabled
        text='call back'
        onEnabledChange={jest.fn()}
        onTextChange={onTextChange}
      />,
    );

    await user.click(screen.getByRole('checkbox'));
    expect(onTextChange).toHaveBeenCalledWith('');
  });

  it('calls onTextChange as the user types', async () => {
    const user = userEvent.setup();
    const onTextChange = jest.fn();
    render(
      <ReminderNoteInput
        enabled
        text=''
        onEnabledChange={jest.fn()}
        onTextChange={onTextChange}
      />,
    );

    await user.type(screen.getByPlaceholderText('Enter reminder note...'), 'a');
    expect(onTextChange).toHaveBeenCalledWith('a');
  });
});
