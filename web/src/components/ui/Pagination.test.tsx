import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Pagination } from './Pagination';

const baseProps = {
  onPageChange: jest.fn(),
  onNext: jest.fn(),
  onPrevious: jest.fn(),
  onFirst: jest.fn(),
  onLast: jest.fn(),
};

describe('Pagination', () => {
  it('calls onPageChange when a page number is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(
      <Pagination
        {...baseProps}
        currentPage={1}
        totalPages={3}
        hasNext
        hasPrevious={false}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables First/Previous when on the first page', () => {
    render(
      <Pagination
        {...baseProps}
        currentPage={1}
        totalPages={3}
        hasNext
        hasPrevious={false}
      />,
    );

    expect(
      screen.getAllByRole('button', { name: 'First page' })[0],
    ).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'Previous' })[0],
    ).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'Next' })[0],
    ).not.toBeDisabled();
  });

  it('disables Next/Last when on the last page', () => {
    render(
      <Pagination
        {...baseProps}
        currentPage={3}
        totalPages={3}
        hasNext={false}
        hasPrevious
      />,
    );

    expect(screen.getAllByRole('button', { name: 'Next' })[0]).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'Last page' })[0],
    ).toBeDisabled();
  });

  it('calls onNext and onPrevious when the corresponding buttons are clicked', async () => {
    const user = userEvent.setup();
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    render(
      <Pagination
        {...baseProps}
        currentPage={2}
        totalPages={3}
        hasNext
        hasPrevious
        onNext={onNext}
        onPrevious={onPrevious}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    expect(onNext).toHaveBeenCalledTimes(1);

    await user.click(screen.getAllByRole('button', { name: 'Previous' })[0]);
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('disables next/previous navigation while loading', () => {
    render(
      <Pagination
        {...baseProps}
        currentPage={2}
        totalPages={3}
        hasNext
        hasPrevious
        loading
      />,
    );

    expect(screen.getAllByRole('button', { name: 'Next' })[0]).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'Previous' })[0],
    ).toBeDisabled();
  });

  it('shows an ellipsis when there are more pages than the visible window', () => {
    render(
      <Pagination
        {...baseProps}
        currentPage={1}
        totalPages={10}
        hasNext
        hasPrevious={false}
      />,
    );

    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
