import { render, screen } from '@testing-library/react';

import { ReminderFormField } from './ReminderFormField';

describe('ReminderFormField', () => {
  it('shows the heading, the description and the note controls', () => {
    render(
      <ReminderFormField
        description='Why this note matters.'
        enabled
        text='check tense'
        onEnabledChange={vi.fn()}
        onTextChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Reminder')).toBeInTheDocument();
    expect(screen.getByText('Why this note matters.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByDisplayValue('check tense')).toBeInTheDocument();
  });
});
