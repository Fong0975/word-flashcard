import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReminderControls } from './ReminderControls';

describe('ReminderControls', () => {
  it.each([
    {
      name: 'the note is off',
      enabled: false,
      disabled: false,
      checkboxDisabled: false,
      inputDisabled: true,
    },
    {
      name: 'the note is on',
      enabled: true,
      disabled: false,
      checkboxDisabled: false,
      inputDisabled: false,
    },
    {
      name: 'the whole control is disabled',
      enabled: true,
      disabled: true,
      checkboxDisabled: true,
      inputDisabled: true,
    },
  ])(
    'sets the disabled state when $name',
    ({ enabled, disabled, checkboxDisabled, inputDisabled }) => {
      render(
        <ReminderControls
          enabled={enabled}
          text=''
          disabled={disabled}
          onEnabledChange={vi.fn()}
          onTextChange={vi.fn()}
        />,
      );

      expect(screen.getByRole('checkbox')).toHaveProperty(
        'disabled',
        checkboxDisabled,
      );
      expect(screen.getByRole('textbox')).toHaveProperty(
        'disabled',
        inputDisabled,
      );
    },
  );

  it('reports checkbox and text changes', async () => {
    const user = userEvent.setup();
    const onEnabledChange = vi.fn();
    const onTextChange = vi.fn();
    render(
      <ReminderControls
        enabled
        text=''
        onEnabledChange={onEnabledChange}
        onTextChange={onTextChange}
      />,
    );

    await user.type(screen.getByRole('textbox'), 'a');
    await user.click(screen.getByRole('checkbox'));

    expect(onTextChange).toHaveBeenCalledWith('a');
    expect(onEnabledChange).toHaveBeenCalledWith(false);
  });
});
