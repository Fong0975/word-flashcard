import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TabNavigation } from './TabNavigation';

describe('TabNavigation', () => {
  it('renders all three tabs', () => {
    render(<TabNavigation currentTab='words' onTabChange={jest.fn()} />);

    expect(screen.getByRole('tab', { name: /Words/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Questions/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Notes/ })).toBeInTheDocument();
  });

  it('marks the current tab as selected', () => {
    render(<TabNavigation currentTab='questions' onTabChange={jest.fn()} />);

    expect(screen.getByRole('tab', { name: /Questions/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /Words/ })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('calls onTabChange with the clicked tab', async () => {
    const user = userEvent.setup();
    const onTabChange = jest.fn();
    render(<TabNavigation currentTab='words' onTabChange={onTabChange} />);

    await user.click(screen.getByRole('tab', { name: /Notes/ }));

    expect(onTabChange).toHaveBeenCalledWith('notes');
  });
});
