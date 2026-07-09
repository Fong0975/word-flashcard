import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EntityReviewSearchBar } from './EntityReviewSearchBar';

describe('EntityReviewSearchBar', () => {
  it('renders the value and placeholder', () => {
    render(
      <EntityReviewSearchBar
        value='cat'
        onChange={jest.fn()}
        onCompositionStart={jest.fn()}
        onCompositionEnd={jest.fn()}
        onClear={jest.fn()}
        placeholder='Search words...'
      />,
    );

    expect(screen.getByPlaceholderText('Search words...')).toHaveValue('cat');
  });

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <EntityReviewSearchBar
        value=''
        onChange={onChange}
        onCompositionStart={jest.fn()}
        onCompositionEnd={jest.fn()}
        onClear={jest.fn()}
        placeholder='Search...'
      />,
    );

    await user.type(screen.getByPlaceholderText('Search...'), 'c');
    expect(onChange).toHaveBeenCalled();
  });

  it('does not render the clear button when the value is empty', () => {
    render(
      <EntityReviewSearchBar
        value=''
        onChange={jest.fn()}
        onCompositionStart={jest.fn()}
        onCompositionEnd={jest.fn()}
        onClear={jest.fn()}
        placeholder='Search...'
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Clear search' }),
    ).not.toBeInTheDocument();
  });

  it('calls onClear when the clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();
    render(
      <EntityReviewSearchBar
        value='cat'
        onChange={jest.fn()}
        onCompositionStart={jest.fn()}
        onCompositionEnd={jest.fn()}
        onClear={onClear}
        placeholder='Search...'
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('fires composition start/end handlers', () => {
    const onCompositionStart = jest.fn();
    const onCompositionEnd = jest.fn();
    render(
      <EntityReviewSearchBar
        value=''
        onChange={jest.fn()}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onClear={jest.fn()}
        placeholder='Search...'
      />,
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.compositionStart(input);
    expect(onCompositionStart).toHaveBeenCalledTimes(1);

    fireEvent.compositionEnd(input);
    expect(onCompositionEnd).toHaveBeenCalledTimes(1);
  });

  it('renders quick filters content when provided', () => {
    render(
      <EntityReviewSearchBar
        value=''
        onChange={jest.fn()}
        onCompositionStart={jest.fn()}
        onCompositionEnd={jest.fn()}
        onClear={jest.fn()}
        placeholder='Search...'
        quickFiltersContent={<div>Quick filters</div>}
      />,
    );

    expect(screen.getByText('Quick filters')).toBeInTheDocument();
  });
});
