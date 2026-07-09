import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PageSelect } from './PageSelect';

describe('PageSelect', () => {
  it('renders an option for every page and the total count', () => {
    render(
      <PageSelect
        currentPage={2}
        totalPages={3}
        onPageChange={jest.fn()}
        loading={false}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveValue('2');
    expect(screen.getByRole('option', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '3' })).toBeInTheDocument();
    expect(screen.getByText('of 3')).toBeInTheDocument();
  });

  it('calls onPageChange with the selected page number', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(
      <PageSelect
        currentPage={1}
        totalPages={3}
        onPageChange={onPageChange}
        loading={false}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox'), '3');

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables the select while loading', () => {
    render(
      <PageSelect
        currentPage={1}
        totalPages={3}
        onPageChange={jest.fn()}
        loading
      />,
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
