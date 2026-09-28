import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PageSelect } from './PageSelect';

describe('PageSelect', () => {
  it('renders an item for every page and the total count', async () => {
    const user = userEvent.setup();
    render(
      <PageSelect
        currentPage={2}
        totalPages={3}
        onPageChange={vi.fn()}
        loading={false}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Select page' }),
    ).toHaveTextContent('2');

    await user.click(screen.getByRole('button', { name: 'Select page' }));

    expect(screen.getByRole('menuitem', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '3' })).toBeInTheDocument();
    expect(screen.getByText('of 3')).toBeInTheDocument();
  });

  it('calls onPageChange with the selected page number', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <PageSelect
        currentPage={1}
        totalPages={3}
        onPageChange={onPageChange}
        loading={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Select page' }));
    await user.click(screen.getByRole('menuitem', { name: '3' }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables the trigger while loading', () => {
    render(
      <PageSelect
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
        loading
      />,
    );

    expect(screen.getByRole('button', { name: 'Select page' })).toBeDisabled();
  });
});
