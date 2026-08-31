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
    keyword: '',
    onKeywordChange: vi.fn(),
    onKeywordCompositionStart: vi.fn(),
    onKeywordCompositionEnd: vi.fn(),
    onKeywordClear: vi.fn(),
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

  it('reports datetime range changes', async () => {
    const user = userEvent.setup();
    const props = renderFilters();

    await user.type(screen.getByLabelText('From'), '2026-08-01T09:00');
    expect(props.onFromChange).toHaveBeenCalled();

    await user.type(screen.getByLabelText('To'), '2026-08-31T18:30');
    expect(props.onToChange).toHaveBeenCalled();
  });

  it('shows the current range values', () => {
    renderFilters({ from: '2026-08-01T09:00', to: '2026-08-31T18:30' });

    expect(screen.getByLabelText('From')).toHaveValue('2026-08-01T09:00');
    expect(screen.getByLabelText('To')).toHaveValue('2026-08-31T18:30');
  });

  it('reports keyword input changes', async () => {
    const user = userEvent.setup();
    const props = renderFilters();

    await user.type(screen.getByLabelText('Search logs'), 'disk');
    expect(props.onKeywordChange).toHaveBeenCalled();
  });

  it('shows the current keyword value', () => {
    renderFilters({ keyword: 'disk full' });

    expect(screen.getByLabelText('Search logs')).toHaveValue('disk full');
  });

  it('hides the clear button when the keyword is empty', () => {
    renderFilters();

    expect(
      screen.queryByRole('button', { name: 'Clear search' }),
    ).not.toBeInTheDocument();
  });

  it('shows the clear button once a keyword is entered', () => {
    renderFilters({ keyword: 'disk' });

    expect(
      screen.getByRole('button', { name: 'Clear search' }),
    ).toBeInTheDocument();
  });

  it('clears the keyword when the clear button is clicked', async () => {
    const user = userEvent.setup();
    const props = renderFilters({ keyword: 'disk' });

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(props.onKeywordClear).toHaveBeenCalled();
  });
});
