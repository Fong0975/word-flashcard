import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TabNavigation } from './TabNavigation';

describe('TabNavigation', () => {
  it('renders all three tabs', () => {
    render(<TabNavigation currentTab='words' onTabChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: /Words/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Questions/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Notes/ })).toBeInTheDocument();
  });

  it.each(['Words', 'Questions', 'Notes'])(
    'labels the %s tab with a decorative SVG icon and plain text only',
    label => {
      render(<TabNavigation currentTab='words' onTabChange={vi.fn()} />);

      const tab = screen.getByRole('tab', { name: label });
      const icon = tab.querySelector('svg');

      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('stroke', 'currentColor');
      expect(icon).toHaveClass('hidden', 'sm:block');
      expect(tab).toHaveTextContent(new RegExp(`^${label}$`));
    },
  );

  it('marks the current tab as selected', () => {
    render(<TabNavigation currentTab='questions' onTabChange={vi.fn()} />);

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
    const onTabChange = vi.fn();
    render(<TabNavigation currentTab='words' onTabChange={onTabChange} />);

    await user.click(screen.getByRole('tab', { name: /Notes/ }));

    expect(onTabChange).toHaveBeenCalledWith('notes');
  });
});
