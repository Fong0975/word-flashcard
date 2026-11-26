import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuickFilterBar } from './QuickFilterBar';

describe('QuickFilterBar', () => {
  it('renders every filter and reports the toggled key', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <QuickFilterBar
        filters={[
          { key: 'recent', label: 'Recent' },
          { key: 'withReminder', label: 'With Reminder' },
        ]}
        activeFilters={['recent']}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByText('Filters:')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'With Reminder' }));

    expect(onToggle).toHaveBeenCalledWith('withReminder');
  });
});
