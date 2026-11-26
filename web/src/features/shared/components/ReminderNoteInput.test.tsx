import { render, screen } from '@testing-library/react';

import { ReminderNoteInput } from './ReminderNoteInput';

describe('ReminderNoteInput', () => {
  it('shows the description and the note controls', () => {
    render(
      <ReminderNoteInput
        description='Set a reminder before moving on.'
        enabled
        text='call back'
        onEnabledChange={vi.fn()}
        onTextChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Set a reminder before moving on.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByDisplayValue('call back')).toBeInTheDocument();
  });
});
