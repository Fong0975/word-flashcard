import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import userEvent from '@testing-library/user-event';

import { LogFilters } from './LogFilters';

const renderFilters = (
  overrides: Partial<ComponentProps<typeof LogFilters>> = {},
) => {
  const props = {
    activeLevels: [] as readonly string[],
    onToggleLevel: vi.fn(),
    from: '',
    to: '',
    onFromChange: vi.fn(),
    onToChange: vi.fn(),
    ...overrides,
  };
  render(<LogFilters {...props} />);

  return props;
};

describe('LogFilters', () => {
  it('renders a pill for every level', () => {
    renderFilters();

    ['DEBUG', 'INFO', 'WARN', 'ERROR'].forEach(level => {
      expect(screen.getByRole('button', { name: level })).toBeInTheDocument();
    });
  });

  it('toggles a level when its pill is clicked', async () => {
    const user = userEvent.setup();
    const props = renderFilters();

    await user.click(screen.getByRole('button', { name: 'WARN' }));

    expect(props.onToggleLevel).toHaveBeenCalledWith('WARN');
  });

  it('reflects the active levels', () => {
    renderFilters({ activeLevels: ['ERROR'] });

    // The active pill carries the filled style; the inactive one does not.
    expect(screen.getByRole('button', { name: 'ERROR' }).className).toContain(
      'bg-primary-500',
    );
    expect(
      screen.getByRole('button', { name: 'INFO' }).className,
    ).not.toContain('bg-primary-500');
  });

  it('reports date range changes', async () => {
    const user = userEvent.setup();
    const props = renderFilters();

    await user.type(screen.getByLabelText('From'), '2026-08-01');
    expect(props.onFromChange).toHaveBeenCalled();

    await user.type(screen.getByLabelText('To'), '2026-08-31');
    expect(props.onToChange).toHaveBeenCalled();
  });

  it('shows the current range values', () => {
    renderFilters({ from: '2026-08-01', to: '2026-08-31' });

    expect(screen.getByLabelText('From')).toHaveValue('2026-08-01');
    expect(screen.getByLabelText('To')).toHaveValue('2026-08-31');
  });
});
